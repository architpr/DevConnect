"use client"

import { useEffect, useState, use, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Loader2, ArrowLeft, User, FileText, ExternalLink, Trophy } from "lucide-react"
import Link from "next/link"
import { LeetCodeStatsCard, GitHubStatsCard, GFGStatsCard } from "@/components/stats/StatsCards"
import type { LeetCodeStats, GitHubStats, GFGStats } from "@/components/stats/StatsCards"
import { ProfileInsightsCard } from "@/components/profile/ProfileInsights"

type UserProfile = {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
    resume_url?: string | null
}

type LinkedAccount = {
    platform: string
    platform_username: string
}

type ProfileInsights = {
    strengths: string[]
    improvements: string[]
    careerPaths: string[]
    skillGaps: { skill: string; priority: 'High' | 'Medium' | 'Low' }[]
    overallScore: number
    summary: string
}

type ResumeAnalysis = {
    atsScore: number
    summary: string
    topSkills: string[]
    suggestions: string[]
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const supabase = createClient()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(false)
    const [insightsLoading, setInsightsLoading] = useState(false)

    const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null)
    const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
    const [gfgStats, setGfgStats] = useState<GFGStats | null>(null)
    const [resumeUrl, setResumeUrl] = useState<string | null>(null)
    const [profileInsights, setProfileInsights] = useState<ProfileInsights | null>(null)
    const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null)

    const fetchProfileInsights = useCallback(async (
        lcStats: LeetCodeStats | null,
        ghStats: GitHubStats | null,
        gfStats: GFGStats | null,
        resume: string | null
    ) => {
        // Only analyze if we have at least some data
        if (!lcStats && !ghStats && !gfStats && !resume) return

        setInsightsLoading(true)
        try {
            const res = await fetch('/api/profile/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leetcodeStats: lcStats,
                    githubStats: ghStats,
                    gfgStats: gfStats,
                    resumeUrl: resume
                })
            })
            if (res.ok) {
                const data = await res.json()
                if (!data.error) setProfileInsights(data)
            }
        } catch (err) {
            console.error('Profile insights error:', err)
        } finally {
            setInsightsLoading(false)
        }
    }, [])

    const fetchStats = useCallback(async (accounts: LinkedAccount[], resume: string | null) => {
        setStatsLoading(true)
        let lcStats = null, ghStats = null, gfStats = null

        const leetcode = accounts.find(a => a.platform === 'leetcode')
        if (leetcode) {
            try {
                const res = await fetch(`/api/stats/leetcode?username=${leetcode.platform_username}`)
                if (res.ok) {
                    const data = await res.json()
                    setLeetcodeStats(data)
                    lcStats = data
                } else {
                    // API failed but account is linked - show minimal data
                    const fallback = { username: leetcode.platform_username, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, profileUrl: `https://leetcode.com/${leetcode.platform_username}` }
                    setLeetcodeStats(fallback)
                    lcStats = fallback
                }
            } catch {
                // Network error - show minimal data
                const fallback = { username: leetcode.platform_username, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0, profileUrl: `https://leetcode.com/${leetcode.platform_username}` }
                setLeetcodeStats(fallback)
                lcStats = fallback
            }
        }

        const github = accounts.find(a => a.platform === 'github')
        if (github) {
            try {
                const res = await fetch(`/api/stats/github?username=${github.platform_username}`)
                if (res.ok) {
                    const data = await res.json()
                    if (!data.error) { setGithubStats(data); ghStats = data }
                }
            } catch { }
        }

        const gfg = accounts.find(a => a.platform === 'geeksforgeeks')
        if (gfg) {
            try {
                const res = await fetch(`/api/stats/gfg?username=${gfg.platform_username}`)
                if (res.ok) {
                    const data = await res.json()
                    setGfgStats(data)
                    gfStats = data
                } else {
                    // API failed but account is linked - show minimal data
                    const fallback = { username: gfg.platform_username, codingScore: 0, problemsSolved: 0, profileUrl: `https://www.geeksforgeeks.org/user/${gfg.platform_username}` }
                    setGfgStats(fallback)
                    gfStats = fallback
                }
            } catch {
                // Network error - show minimal data
                const fallback = { username: gfg.platform_username, codingScore: 0, problemsSolved: 0, profileUrl: `https://www.geeksforgeeks.org/user/${gfg.platform_username}` }
                setGfgStats(fallback)
                gfStats = fallback
            }
        }

        setStatsLoading(false)

        // Fetch AI insights after stats are loaded
        fetchProfileInsights(lcStats, ghStats, gfStats, resume)
    }, [fetchProfileInsights])

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', resolvedParams.id)
                .single()

            if (profileError || !profileData) {
                setLoading(false)
                return
            }

            setProfile(profileData as UserProfile)
            let userResumeUrl: string | null = null
            const appendCacheBust = (url: string) => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
            const candidateResumeUrls: string[] = []

            const profileResumeUrl = (profileData as UserProfile).resume_url
            if (profileResumeUrl) {
                candidateResumeUrls.push(appendCacheBust(profileResumeUrl))
            }

            // Fallback path check for older records
            const { data: resumeData } = await supabase.storage
                .from('resumes')
                .getPublicUrl(`${resolvedParams.id}/resume.pdf`)

            if (resumeData?.publicUrl && resumeData.publicUrl !== profileResumeUrl) {
                candidateResumeUrls.push(appendCacheBust(resumeData.publicUrl))
            }

            for (const candidateUrl of candidateResumeUrls) {
                try {
                    const response = await fetch(candidateUrl, { method: 'HEAD', cache: 'no-store' })
                    if (response.ok) {
                        setResumeUrl(candidateUrl)
                        userResumeUrl = candidateUrl

                        // Fetch resume ATS analysis
                        try {
                            const atsRes = await fetch('/api/resume/analyze', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ resumeUrl: candidateUrl })
                            })
                            if (atsRes.ok) {
                                const atsData = await atsRes.json()
                                if (!atsData.error) setResumeAnalysis(atsData)
                            }
                        } catch { }
                        break
                    }
                } catch { }
            }

            // Get linked accounts
            const { data: accountsData } = await supabase
                .from('linked_accounts')
                .select('platform, platform_username')
                .eq('user_id', resolvedParams.id)

            if (accountsData) {
                setLinkedAccounts(accountsData as LinkedAccount[])
                fetchStats(accountsData as LinkedAccount[], userResumeUrl)
            }

            setLoading(false)
        }

        fetchProfile()
    }, [resolvedParams.id, supabase, fetchStats])

    const totalScore = (leetcodeStats?.totalSolved || 0) +
        (githubStats?.publicRepos || 0) * 5 +
        (githubStats?.totalStars || 0) * 2 +
        (gfgStats?.codingScore || 0)

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-purple-500 h-8 w-8" />
                <p className="text-gray-400">Loading profile...</p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <User className="h-16 w-16 text-gray-500" />
                <h2 className="text-2xl font-bold">User Not Found</h2>
                <p className="text-gray-400">This user profile doesn&apos;t exist.</p>
                <Link href="/feed">
                    <Button className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to BuildBoard
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <Link href="/feed" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to BuildBoard
            </Link>

            {/* Profile Header */}
            <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/30">
                <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold shadow-lg shadow-purple-500/20">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                profile.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                                {profile.full_name}
                            </h1>
                            <p className="text-gray-400 text-lg">@{profile.username}</p>
                            {totalScore > 0 && (
                                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
                                    <Trophy className="h-5 w-5 text-yellow-400" />
                                    <span className="font-bold text-yellow-400">{totalScore}</span>
                                    <span className="text-gray-400 text-sm">Developer Score</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Coding Stats */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-300">Coding Stats</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <LeetCodeStatsCard stats={leetcodeStats} loading={statsLoading} />
                    <GitHubStatsCard stats={githubStats} loading={statsLoading} />
                    <GFGStatsCard stats={gfgStats} loading={statsLoading} />
                </div>
            </div>

            {/* AI Profile Insights */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-300">AI Profile Analysis</h2>
                <ProfileInsightsCard
                    insights={profileInsights}
                    loading={insightsLoading}
                />
            </div>

            {/* Resume */}
            {resumeUrl && (
                <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-500/20">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Resume</h3>
                                    {resumeAnalysis ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-400">ATS Score:</span>
                                            <span className={`font-bold ${resumeAnalysis.atsScore >= 70 ? 'text-green-400' :
                                                resumeAnalysis.atsScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>{resumeAnalysis.atsScore}/100</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">View this user&apos;s resume</p>
                                    )}
                                </div>
                            </div>
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <Button>
                                    <ExternalLink className="mr-2 h-4 w-4" /> View Resume
                                </Button>
                            </a>
                        </div>
                        {resumeAnalysis && resumeAnalysis.topSkills && resumeAnalysis.topSkills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-xs text-gray-500 uppercase mb-2">Extracted Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {resumeAnalysis.topSkills.map((skill, i) => (
                                        <span key={i} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
