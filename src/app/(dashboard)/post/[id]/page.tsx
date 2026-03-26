"use client"

import { useEffect, useState, use, useCallback } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Loader2, ArrowLeft, Check, X, Code, Github, Terminal, ChevronDown, ChevronUp, User, Calendar, Users, Mail, ExternalLink, Trophy, Flame, Star } from "lucide-react"
import Link from "next/link"

type Post = {
    id: string
    title: string
    description: string
    hackathon_name: string | null
    skills_required: string[]
    created_at: string
    user_id: string
    profiles: {
        full_name: string
        username: string
    }
}

type Application = {
    id: string
    status: string
    created_at: string
    candidate_id: string
    candidate: {
        id: string
        full_name: string
        username: string
        avatar_url: string | null
        email?: string | null
    }
}

type CandidateStats = {
    leetcode: {
        totalSolved: number
        easySolved: number
        mediumSolved: number
        hardSolved: number
        contestRating?: number | null
        contestRanking?: number | null
        contestsAttended?: number
        acceptanceRate?: number | null
        streak?: number
        ranking?: string | number
        profileUrl?: string
    } | null
    github: {
        publicRepos: number
        followers: number
        following?: number
        totalStars: number
        totalForks?: number
        topLanguages?: { language: string; repos: number }[]
        profileUrl?: string
    } | null
    gfg: {
        codingScore: number
        problemsSolved: number
        monthlyScore?: number
        streak?: number
        instituteRank?: string
        profileUrl?: string
    } | null
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const { user } = useAuth()
    const supabase = createClient()

    const [post, setPost] = useState<Post | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedApp, setExpandedApp] = useState<string | null>(null)
    const [candidateStats, setCandidateStats] = useState<{ [key: string]: CandidateStats }>({})
    const [loadingStats, setLoadingStats] = useState<{ [key: string]: boolean }>({})

    const isOwner = post?.user_id === user?.id

    const buildCandidateGmailCompose = (app: Application) => {
        const to = app.candidate?.email?.trim()
        if (!to) return null

        const candidateName = app.candidate?.full_name || app.candidate?.username || 'Applicant'
        const subject = encodeURIComponent(`Hackathon Collaboration - ${post?.title || 'Team Post'} (Accepted)`)
        const body = encodeURIComponent(
            `Hi ${candidateName},\n\nCongratulations! Your application for ${post?.title || 'our team post'} has been accepted.\n\nPlease share your availability so we can discuss next steps and team coordination.\n\nBest regards,`
        )

        return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subject}&body=${body}`
    }

    useEffect(() => {
        const fetchPost = async () => {
            const { data: postData, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (full_name, username)
                `)
                .eq('id', resolvedParams.id)
                .single()

            if (error || !postData) {
                setLoading(false)
                return
            }

            setPost(postData as Post)

            // Fetch applications if owner
            if (postData.user_id === user?.id) {
                const { data: appsData } = await supabase
                    .from('applications')
                    .select('id, status, created_at, candidate_id')
                    .eq('post_id', resolvedParams.id)
                    .order('created_at', { ascending: false })

                if (appsData) {
                    const enrichedApps = await Promise.all(appsData.map(async (app) => {
                        const { data: candidate } = await supabase
                            .from('profiles')
                            .select('id, full_name, username, avatar_url, email')
                            .eq('id', app.candidate_id)
                            .single()
                        return { ...app, candidate }
                    }))
                    setApplications(enrichedApps as Application[])
                }
            }

            setLoading(false)
        }

        if (user) fetchPost()
    }, [resolvedParams.id, user, supabase])

    const fetchCandidateStats = useCallback(async (candidateId: string) => {
        if (candidateStats[candidateId] || loadingStats[candidateId]) return

        setLoadingStats(prev => ({ ...prev, [candidateId]: true }))

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
            alert(`Error: ${error.message}`)
            return
        }

        // Get current user's profile for notification
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single()

        // Create notification
        await supabase.from('notifications').insert({
            user_id: app.candidate?.id,
            type: newStatus === 'accepted' ? 'application_accepted' : 'application_rejected',
            title: newStatus === 'accepted' ? '🎉 Application Accepted!' : 'Application Update',
            message: newStatus === 'accepted'
                ? `Your application to join the team has been accepted!`
                : `Your application was not accepted this time.`,
            post_title: post?.title || 'Team Post',
            team_lead_email: user?.email || '',
            team_lead_name: myProfile?.full_name || 'Team Lead',
            is_read: false
        })

        setApplications(prev =>
            prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
        )
    }

    const pendingApps = applications.filter(a => a.status === 'pending')
    const acceptedApps = applications.filter(a => a.status === 'accepted')
    const rejectedApps = applications.filter(a => a.status === 'rejected')

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-purple-500 h-8 w-8" />
                <p className="text-gray-400">Loading post...</p>
            </div>
        )
    }

    if (!post) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <h2 className="text-2xl font-bold">Post Not Found</h2>
                <Link href="/feed"><Button><ArrowLeft className="mr-2 h-4 w-4" /> Back to BuildBoard</Button></Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Link href="/feed" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to BuildBoard
            </Link>

            {/* Post Details */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-purple-500/30">
                <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.created_at).toLocaleDateString()}
                        {post.hackathon_name && (
                            <>
                                <span className="mx-2">•</span>
                                <span className="text-purple-400">{post.hackathon_name}</span>
                            </>
                        )}
                    </div>
                    <CardTitle className="text-2xl">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Posted by {post.profiles?.full_name} (@{post.profiles?.username})
                        {isOwner && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Your Post</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-300 mb-6">{post.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {post.skills_required?.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Applications Section (only for owner) */}
            {isOwner && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-purple-400" />
                        <h2 className="text-xl font-semibold">Applications ({applications.length})</h2>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{pendingApps.length}</div>
                            <div className="text-sm text-gray-400">Pending</div>
                        </div>
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                            <div className="text-2xl font-bold text-green-400">{acceptedApps.length}</div>
                            <div className="text-sm text-gray-400">Accepted</div>
                        </div>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                            <div className="text-2xl font-bold text-red-400">{rejectedApps.length}</div>
                            <div className="text-sm text-gray-400">Rejected</div>
                        </div>
                    </div>

                    {/* Pending Applications */}
                    {pendingApps.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-yellow-400 mb-3">⏳ Pending</h3>
                            <div className="space-y-3">
                                {pendingApps.map(app => (
                                    <Card key={app.id} className="border-yellow-500/30">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <Link href={`/user/${app.candidate?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                                                        {app.candidate?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{app.candidate?.full_name}</div>
                                                        <div className="text-sm text-gray-400">@{app.candidate?.username}</div>
                                                    </div>
                                                </Link>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" onClick={() => handleExpand(app.id, app.candidate?.id)} className="text-sm">
                                                        Stats {expandedApp === app.id ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                                                    </Button>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(app.id, 'accepted')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {expandedApp === app.id && (
                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                    {loadingStats[app.candidate?.id] ? (
                                                        <Loader2 className="animate-spin h-5 w-5" />
                                                    ) : candidateStats[app.candidate?.id] ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                                                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/25 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="inline-flex items-center gap-2 text-yellow-400 font-medium text-sm">
                                                                            <Code className="h-4 w-4" /> LeetCode
                                                                        </div>
                                                                        {candidateStats[app.candidate?.id]?.leetcode?.profileUrl && (
                                                                            <a
                                                                                href={candidateStats[app.candidate?.id]?.leetcode?.profileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs text-yellow-300 hover:text-yellow-200 inline-flex items-center gap-1"
                                                                            >
                                                                                Profile <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-2xl font-bold text-yellow-300">{candidateStats[app.candidate?.id]?.leetcode?.totalSolved || 0}</div>
                                                                    <div className="text-xs text-gray-400">Total Solved</div>
                                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-green-400">{candidateStats[app.candidate?.id]?.leetcode?.easySolved || 0}</div>
                                                                            <div className="text-gray-400">Easy</div>
                                                                        </div>
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-yellow-300">{candidateStats[app.candidate?.id]?.leetcode?.mediumSolved || 0}</div>
                                                                            <div className="text-gray-400">Medium</div>
                                                                        </div>
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-red-400">{candidateStats[app.candidate?.id]?.leetcode?.hardSolved || 0}</div>
                                                                            <div className="text-gray-400">Hard</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                                                                        <div className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-yellow-300" /> Rating: {candidateStats[app.candidate?.id]?.leetcode?.contestRating || 'N/A'}</div>
                                                                        <div className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-400" /> Streak: {candidateStats[app.candidate?.id]?.leetcode?.streak || 0}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-400/25 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="inline-flex items-center gap-2 text-slate-200 font-medium text-sm">
                                                                            <Github className="h-4 w-4" /> GitHub
                                                                        </div>
                                                                        {candidateStats[app.candidate?.id]?.github?.profileUrl && (
                                                                            <a
                                                                                href={candidateStats[app.candidate?.id]?.github?.profileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                                                                            >
                                                                                Profile <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-slate-100">{candidateStats[app.candidate?.id]?.github?.publicRepos || 0}</div>
                                                                            <div className="text-gray-400">Repos</div>
                                                                        </div>
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-slate-100">{candidateStats[app.candidate?.id]?.github?.followers || 0}</div>
                                                                            <div className="text-gray-400">Followers</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-yellow-300 inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{candidateStats[app.candidate?.id]?.github?.totalStars || 0}</div>
                                                                            <div className="text-gray-400">Stars</div>
                                                                        </div>
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-slate-100">{candidateStats[app.candidate?.id]?.github?.totalForks || 0}</div>
                                                                            <div className="text-gray-400">Forks</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-300">
                                                                        Top Languages: {(candidateStats[app.candidate?.id]?.github?.topLanguages || []).slice(0, 3).map(l => l.language).join(', ') || 'N/A'}
                                                                    </div>
                                                                </div>

                                                                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/25 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="inline-flex items-center gap-2 text-green-400 font-medium text-sm">
                                                                            <Terminal className="h-4 w-4" /> GeeksforGeeks
                                                                        </div>
                                                                        {candidateStats[app.candidate?.id]?.gfg?.profileUrl && (
                                                                            <a
                                                                                href={candidateStats[app.candidate?.id]?.gfg?.profileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-xs text-green-300 hover:text-green-200 inline-flex items-center gap-1"
                                                                            >
                                                                                Profile <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-green-300">{candidateStats[app.candidate?.id]?.gfg?.codingScore || 0}</div>
                                                                            <div className="text-gray-400">Coding Score</div>
                                                                        </div>
                                                                        <div className="rounded-md bg-black/20 p-2 text-center">
                                                                            <div className="font-semibold text-green-300">{candidateStats[app.candidate?.id]?.gfg?.problemsSolved || 0}</div>
                                                                            <div className="text-gray-400">Solved</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                                                                        <div>Monthly: {candidateStats[app.candidate?.id]?.gfg?.monthlyScore || 0}</div>
                                                                        <div>Streak: {candidateStats[app.candidate?.id]?.gfg?.streak || 0}</div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-300">Institute Rank: {candidateStats[app.candidate?.id]?.gfg?.instituteRank || 'N/A'}</div>
                                                                </div>
                                                            </div>

                                                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-300 grid grid-cols-1 md:grid-cols-4 gap-2">
                                                                <div>LeetCode Acceptance: {candidateStats[app.candidate?.id]?.leetcode?.acceptanceRate ? `${candidateStats[app.candidate?.id]?.leetcode?.acceptanceRate}%` : 'N/A'}</div>
                                                                <div>LeetCode Contests: {candidateStats[app.candidate?.id]?.leetcode?.contestsAttended || 0}</div>
                                                                <div>GitHub Following: {candidateStats[app.candidate?.id]?.github?.following || 0}</div>
                                                                <div>LeetCode Rank: {candidateStats[app.candidate?.id]?.leetcode?.ranking || 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 text-sm">No stats available</div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accepted */}
                    {acceptedApps.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-green-400 mb-3">✓ Accepted Team Members</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {acceptedApps.map(app => (
                                    <div key={app.id} className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                                        <Link href={`/user/${app.candidate?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                            <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center font-bold">
                                                {app.candidate?.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{app.candidate?.full_name}</div>
                                                <div className="text-sm text-gray-400">@{app.candidate?.username}</div>
                                            </div>
                                        </Link>

                                        <div className="mt-3">
                                            {(() => {
                                                const gmailUrl = buildCandidateGmailCompose(app)
                                                if (!gmailUrl) {
                                                    return (
                                                        <div className="space-y-1">
                                                            <Button size="sm" variant="outline" className="gap-2" disabled title="Applicant email not available">
                                                                <Mail className="h-4 w-4" />
                                                                Mail Applicant (Gmail)
                                                            </Button>
                                                            <p className="text-xs text-gray-500">Applicant email missing.</p>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm" variant="outline" className="gap-2 border-yellow-500/35 text-zinc-800 dark:text-zinc-100 hover:bg-yellow-400/10">
                                                            <Mail className="h-4 w-4" />
                                                            Mail Applicant (Gmail)
                                                        </Button>
                                                    </a>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {applications.length === 0 && (
                        <Card className="text-center py-12 bg-gray-500/5 border-gray-500/20">
                            <CardContent>
                                <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                                <h3 className="text-lg font-medium mb-1">No Applications Yet</h3>
                                <p className="text-gray-400">When developers apply, they&apos;ll appear here.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
