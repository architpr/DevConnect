"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Loader2, Check, X, User, Github, Code, Terminal, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"

type Application = {
    id: string
    status: string
    created_at: string
    post: {
        id: string
        title: string
        description: string
    }
    candidate: {
        id: string
        full_name: string
        username: string
        avatar_url: string | null
    }
}

type LinkedAccount = {
    platform: string
    platform_username: string
}

type CandidateStats = {
    leetcode: {
        totalSolved: number
        easySolved: number
        mediumSolved: number
        hardSolved: number
    } | null
    github: {
        publicRepos: number
        followers: number
        totalStars: number
    } | null
    gfg: {
        codingScore: number
        problemsSolved: number
    } | null
}

export default function RequestsPage() {
    const { user } = useAuth()
    const supabase = createClient()

    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedApp, setExpandedApp] = useState<string | null>(null)
    const [candidateStats, setCandidateStats] = useState<{ [key: string]: CandidateStats }>({})
    const [loadingStats, setLoadingStats] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user) return

            // First get user's posts
            const { data: myPosts } = await supabase
                .from('posts')
                .select('id')
                .eq('user_id', user.id)

            if (!myPosts || myPosts.length === 0) {
                setLoading(false)
                return
            }

            const postIds = myPosts.map(p => p.id)

            // Get applications for those posts
            const { data: apps, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    status,
                    created_at,
                    post_id,
                    candidate_id
                `)
                .in('post_id', postIds)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching applications:', error)
                setLoading(false)
                return
            }

            if (apps && apps.length > 0) {
                // Fetch post and candidate details
                const enrichedApps = await Promise.all(apps.map(async (app) => {
                    const [postRes, candidateRes] = await Promise.all([
                        supabase.from('posts').select('id, title, description').eq('id', app.post_id).single(),
                        supabase.from('profiles').select('id, full_name, username, avatar_url').eq('id', app.candidate_id).single()
                    ])
                    return {
                        ...app,
                        post: postRes.data,
                        candidate: candidateRes.data
                    }
                }))
                setApplications(enrichedApps as Application[])
            }

            setLoading(false)
        }

        fetchApplications()
    }, [user, supabase])

    const fetchCandidateStats = useCallback(async (candidateId: string) => {
        if (candidateStats[candidateId] || loadingStats[candidateId]) return

        setLoadingStats(prev => ({ ...prev, [candidateId]: true }))

        // Get candidate's linked accounts
        const { data: accounts } = await supabase
            .from('linked_accounts')
            .select('platform, platform_username')
            .eq('user_id', candidateId)

        const stats: CandidateStats = { leetcode: null, github: null, gfg: null }

        if (accounts) {
            const promises: Promise<void>[] = []

            const leetcode = accounts.find(a => a.platform === 'leetcode')
            if (leetcode) {
                promises.push(
                    fetch(`/api/stats/leetcode?username=${leetcode.platform_username}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => { if (data && !data.error) stats.leetcode = data })
                        .catch(() => { })
                )
            }

            const github = accounts.find(a => a.platform === 'github')
            if (github) {
                promises.push(
                    fetch(`/api/stats/github?username=${github.platform_username}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => { if (data && !data.error) stats.github = data })
                        .catch(() => { })
                )
            }

            const gfg = accounts.find(a => a.platform === 'geeksforgeeks')
            if (gfg) {
                promises.push(
                    fetch(`/api/stats/gfg?username=${gfg.platform_username}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(data => { if (data && !data.error) stats.gfg = data })
                        .catch(() => { })
                )
            }

            await Promise.all(promises)
        }

        setCandidateStats(prev => ({ ...prev, [candidateId]: stats }))
        setLoadingStats(prev => ({ ...prev, [candidateId]: false }))
    }, [candidateStats, loadingStats, supabase])

    const handleExpand = (appId: string, candidateId: string) => {
        if (expandedApp === appId) {
            setExpandedApp(null)
        } else {
            setExpandedApp(appId)
            fetchCandidateStats(candidateId)
        }
    }

    const handleUpdateStatus = async (appId: string, newStatus: 'accepted' | 'rejected') => {
        const app = applications.find(a => a.id === appId)
        if (!app) return

        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', appId)

        if (error) {
            alert(`Error updating application: ${error.message}`)
            return
        }

        // Get current user's profile for notification
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single()

        // Get current user's email
        const userEmail = user?.email || ''

        // Create notification for the candidate
        await supabase.from('notifications').insert({
            user_id: app.candidate?.id,
            type: newStatus === 'accepted' ? 'application_accepted' : 'application_rejected',
            title: newStatus === 'accepted' ? '🎉 Application Accepted!' : 'Application Update',
            message: newStatus === 'accepted'
                ? `Great news! Your application to join the team has been accepted. You can now contact the team lead.`
                : `Unfortunately, your application was not accepted this time. Keep applying to other teams!`,
            post_title: app.post?.title || 'Team Post',
            team_lead_email: userEmail,
            team_lead_name: myProfile?.full_name || 'Team Lead',
            is_read: false
        })

        setApplications(prev =>
            prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
        )
    }

    const pendingApps = applications.filter(a => a.status === 'pending')
    const processedApps = applications.filter(a => a.status !== 'pending')

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-purple-500 h-8 w-8" />
                <p className="text-gray-400">Loading requests...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
                    Team Join Requests
                </h1>
                <p className="text-gray-400 mt-2">Review applications from developers who want to join your team.</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-400">{pendingApps.length}</div>
                        <div className="text-sm text-gray-400">Pending Requests</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-400">{applications.filter(a => a.status === 'accepted').length}</div>
                        <div className="text-sm text-gray-400">Accepted</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-red-400">{applications.filter(a => a.status === 'rejected').length}</div>
                        <div className="text-sm text-gray-400">Rejected</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Applications */}
            {pendingApps.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-yellow-400">⏳ Pending Requests</h2>
                    <div className="space-y-4">
                        {pendingApps.map(app => (
                            <Card key={app.id} className="border-yellow-500/30 hover:border-yellow-500/50 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                                                {app.candidate?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{app.candidate?.full_name || 'Unknown User'}</CardTitle>
                                                <CardDescription>@{app.candidate?.username} wants to join your team</CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleExpand(app.id, app.candidate?.id)}
                                            className="gap-2"
                                        >
                                            View Profile
                                            {expandedApp === app.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                                        <div className="text-sm text-gray-400 mb-1">Applied for:</div>
                                        <div className="font-medium">{app.post?.title}</div>
                                    </div>

                                    {/* Expanded Stats Section */}
                                    {expandedApp === app.id && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <h4 className="text-sm font-semibold text-purple-400 mb-4 uppercase tracking-wider">Candidate Stats</h4>

                                            {loadingStats[app.candidate?.id] ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin h-5 w-5" />
                                                    <span className="text-gray-400">Loading stats...</span>
                                                </div>
                                            ) : candidateStats[app.candidate?.id] ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* LeetCode */}
                                                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Code className="h-4 w-4 text-yellow-500" />
                                                            <span className="font-medium">LeetCode</span>
                                                        </div>
                                                        {candidateStats[app.candidate?.id]?.leetcode ? (
                                                            <div>
                                                                <div className="text-2xl font-bold text-yellow-400">
                                                                    {candidateStats[app.candidate?.id]?.leetcode?.totalSolved}
                                                                </div>
                                                                <div className="text-xs text-gray-400">Problems Solved</div>
                                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                                    <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                                                        E: {candidateStats[app.candidate?.id]?.leetcode?.easySolved}
                                                                    </span>
                                                                    <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                                                        M: {candidateStats[app.candidate?.id]?.leetcode?.mediumSolved}
                                                                    </span>
                                                                    <span className="px-1 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                                                                        H: {candidateStats[app.candidate?.id]?.leetcode?.hardSolved}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-500 text-sm">Not connected</div>
                                                        )}
                                                    </div>

                                                    {/* GitHub */}
                                                    <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Github className="h-4 w-4" />
                                                            <span className="font-medium">GitHub</span>
                                                        </div>
                                                        {candidateStats[app.candidate?.id]?.github ? (
                                                            <div>
                                                                <div className="text-2xl font-bold">
                                                                    {candidateStats[app.candidate?.id]?.github?.publicRepos}
                                                                </div>
                                                                <div className="text-xs text-gray-400">Repositories</div>
                                                                <div className="flex gap-2 mt-2">
                                                                    <span className="text-xs text-yellow-400">★ {candidateStats[app.candidate?.id]?.github?.totalStars}</span>
                                                                    <span className="text-xs text-blue-400">👥 {candidateStats[app.candidate?.id]?.github?.followers}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-500 text-sm">Not connected</div>
                                                        )}
                                                    </div>

                                                    {/* GFG */}
                                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Terminal className="h-4 w-4 text-green-500" />
                                                            <span className="font-medium">GeeksForGeeks</span>
                                                        </div>
                                                        {candidateStats[app.candidate?.id]?.gfg ? (
                                                            <div>
                                                                <div className="text-2xl font-bold text-green-400">
                                                                    {candidateStats[app.candidate?.id]?.gfg?.codingScore}
                                                                </div>
                                                                <div className="text-xs text-gray-400">Coding Score</div>
                                                                <div className="text-xs text-green-400 mt-2">
                                                                    {candidateStats[app.candidate?.id]?.gfg?.problemsSolved} solved
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-500 text-sm">Not connected</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">No stats available</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-4">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                                            onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                        >
                                            <Check className="h-4 w-4" /> Accept
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2"
                                            onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                        >
                                            <X className="h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Processed Applications */}
            {processedApps.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-400">📋 Previous Requests</h2>
                    <div className="space-y-3">
                        {processedApps.map(app => (
                            <Card key={app.id} className={`border-white/10 ${app.status === 'accepted' ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                                                {app.candidate?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium">{app.candidate?.full_name}</div>
                                                <div className="text-sm text-gray-400">Applied for: {app.post?.title}</div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${app.status === 'accepted'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {app.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {applications.length === 0 && (
                <Card className="text-center py-16 bg-gradient-to-br from-gray-500/5 to-gray-600/5 border-gray-500/20">
                    <CardContent>
                        <User className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Requests Yet</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            When developers apply to join your team posts, they&apos;ll appear here. Create a post to start receiving applications!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
