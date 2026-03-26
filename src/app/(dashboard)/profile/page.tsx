"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Loader2, Upload, FileText, Github, Code, Terminal, Award, Star, Users, Sparkles, RefreshCw, ChevronRight, Trophy, ExternalLink, TrendingUp, Zap, Target, User, Microscope } from "lucide-react"
import Link from "next/link"
import { ProfileInsightsCard } from "@/components/profile/ProfileInsights"
import { ResearchProfileSection } from "@/components/profile/ResearchProfileSection"

type Profile = {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    resume_url: string | null
}

type LinkedAccount = {
    platform: string
    platform_username: string
}

type LeetCodeStats = {
    totalSolved: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
    ranking: string | number
    totalQuestions?: number
    contestRating?: number | null
    contestRanking?: number | null
    contestsAttended?: number
    badges?: string[]
    streak?: number
    profileUrl?: string
}

type GitHubStats = {
    publicRepos: number
    followers: number
    totalStars: number
    totalForks?: number
    topLanguages?: { language: string; repos: number }[]
    topRepos?: { name: string; url: string; stars: number; language: string; forks: number }[]
    accountAgeYears?: number
    profileUrl?: string
}

type GFGStats = {
    codingScore: number
    problemsSolved: number
    monthlyScore?: number
    streak?: number
    instituteRank?: string
    profileUrl?: string
}

type ResumeAnalysis = {
    atsScore: number
    summary: string
    topSkills: string[]
    suggestions: string[]
}

type ProfileInsights = {
    strengths: string[]
    improvements: string[]
    careerPaths: string[]
    skillGaps: { skill: string; priority: 'High' | 'Medium' | 'Low' }[]
    overallScore: number
    summary: string
}

export default function ProfilePage() {
    const { user } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Stats states
    const [leetcodeStats, setLeetcodeStats] = useState<LeetCodeStats | null>(null)
    const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
    const [gfgStats, setGfgStats] = useState<GFGStats | null>(null)
    const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null)
    const [resumeAnalysisError, setResumeAnalysisError] = useState<string | null>(null)
    const [profileInsights, setProfileInsights] = useState<ProfileInsights | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [insightsLoading, setInsightsLoading] = useState(false)

    const supabase = createClient()

    const fetchProfileInsights = useCallback(async (
        lcStats: LeetCodeStats | null,
        ghStats: GitHubStats | null,
        gfStats: GFGStats | null,
        resumeUrl: string | null
    ) => {
        if (!lcStats && !ghStats && !gfStats && !resumeUrl) return

        setInsightsLoading(true)
        try {
            const res = await fetch('/api/profile/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leetcodeStats: lcStats,
                    githubStats: ghStats,
                    gfgStats: gfStats,
                    resumeUrl
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

    const fetchStats = useCallback(async (accounts: LinkedAccount[], resumeUrl: string | null) => {
        setStatsLoading(true)

        let lcStats: LeetCodeStats | null = null
        let ghStats: GitHubStats | null = null
        let gfStats: GFGStats | null = null

        const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 25000) => {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), timeout)
            try {
                const response = await fetch(url, { ...options, signal: controller.signal })
                clearTimeout(id)
                return response
            } catch (err) {
                clearTimeout(id)
                throw err
            }
        }

        const promises = []

        // LeetCode
        const leetcodeAccount = accounts.find(a => a.platform === 'leetcode')
        if (leetcodeAccount) {
            promises.push((async () => {
                try {
                    const res = await fetchWithTimeout(`/api/stats/leetcode?username=${leetcodeAccount.platform_username}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (!data.error) { setLeetcodeStats(data); lcStats = data }
                    }
                } catch { }
            })())
        }

        // GitHub
        const githubAccount = accounts.find(a => a.platform === 'github')
        if (githubAccount) {
            promises.push((async () => {
                try {
                    const res = await fetchWithTimeout(`/api/stats/github?username=${githubAccount.platform_username}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (!data.error) { setGithubStats(data); ghStats = data }
                    }
                } catch { }
            })())
        }

        // GFG
        const gfgAccount = accounts.find(a => a.platform === 'geeksforgeeks')
        if (gfgAccount) {
            promises.push((async () => {
                try {
                    const res = await fetchWithTimeout(`/api/stats/gfg?username=${gfgAccount.platform_username}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (!data.error) { setGfgStats(data); gfStats = data }
                    }
                } catch { }
            })())
        }

        // Resume Analysis
        if (resumeUrl) {
            promises.push((async () => {
                try {
                    const res = await fetchWithTimeout('/api/resume/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resumeUrl })
                    }, 40000)
                    const data = await res.json()
                    if (res.ok && !data.error) {
                        setResumeAnalysis(data)
                        setResumeAnalysisError(null)
                    } else {
                        setResumeAnalysis(null)
                        setResumeAnalysisError(data?.error || 'Unable to analyze this file as a resume.')
                    }
                } catch {
                    setResumeAnalysis(null)
                    setResumeAnalysisError('Unable to analyze resume right now. Please try again.')
                }
            })())
        } else {
            setResumeAnalysis(null)
            setResumeAnalysisError(null)
        }

        await Promise.allSettled(promises)
        setStatsLoading(false)

        // Fetch AI Profile Insights with collected stats
        fetchProfileInsights(lcStats, ghStats, gfStats, resumeUrl)
    }, [fetchProfileInsights])

    useEffect(() => {
        const loadData = async () => {
            if (!user) return

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) setProfile(profileData)

            // Fetch linked accounts
            const { data: accounts } = await supabase
                .from('linked_accounts')
                .select('platform, platform_username')
                .eq('user_id', user.id)

            if (accounts) {
                setLinkedAccounts(accounts)
                fetchStats(accounts, profileData?.resume_url || null)
            }

            setLoading(false)
        }

        loadData()
    }, [user, supabase, fetchStats])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchStats(linkedAccounts, profile?.resume_url || null)
        setRefreshing(false)
    }

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            setResumeAnalysis(null)
            setResumeAnalysisError('Please upload a PDF resume. DOC and DOCX files are not supported by the ATS scorer yet.')
            e.target.value = ''
            return
        }

        setUploading(true)
        setUploadSuccess(false)
        setResumeAnalysisError(null)

        try {
            const fileName = `${user.id}/resume.pdf`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, file, {
                    upsert: true,
                    cacheControl: '0',
                    contentType: 'application/pdf'
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl: publicURL } } = supabase.storage
                .from('resumes')
                .getPublicUrl(fileName)
            const versionedResumeUrl = `${publicURL}${publicURL.includes('?') ? '&' : '?'}v=${Date.now()}`

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ resume_url: versionedResumeUrl })
                .eq('id', user.id)

            if (updateError) throw updateError

            setProfile(prev => prev ? { ...prev, resume_url: versionedResumeUrl } : null)
            setUploadSuccess(true)
            setTimeout(() => setUploadSuccess(false), 5000)

            // Trigger resume analysis
            try {
                const res = await fetch('/api/resume/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeUrl: versionedResumeUrl })
                })
                const data = await res.json()
                if (res.ok && !data.error) {
                    setResumeAnalysis(data)
                    setResumeAnalysisError(null)
                } else {
                    setResumeAnalysis(null)
                    setResumeAnalysisError(data?.error || 'Unable to analyze this file as a resume.')
                }
            } catch (e) {
                console.error('Resume analysis error:', e)
                setResumeAnalysis(null)
                setResumeAnalysisError('Unable to analyze resume right now. Please try again.')
            }

        } catch (error: unknown) {
            alert(`Error uploading resume: ${(error as Error).message}`)
        } finally {
            e.target.value = ''
            setUploading(false)
        }
    }

    const getLinkedUsername = (platform: string) => {
        return linkedAccounts.find(a => a.platform === platform)?.platform_username
    }

    // Calculate total score
    const totalScore = (leetcodeStats?.totalSolved || 0) +
        (githubStats?.publicRepos || 0) * 10 +
        (gfgStats?.codingScore || 0) +
        (resumeAnalysis?.atsScore || 0)

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
                    <Loader2 className="absolute inset-0 m-auto animate-spin text-purple-500 h-8 w-8" />
                </div>
                <p className="text-gray-400 animate-pulse">Loading your profile...</p>
            </div>
        )
    }

    const hasNoAccounts = linkedAccounts.length === 0 && !profile?.resume_url

    return (
        <div className="space-y-8 pb-8">
            {/* Profile Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8 border border-white/10">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                                {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                    {profile?.full_name || 'Developer'}
                                </h1>
                                <p className="text-gray-400">@{profile?.username || user?.email?.split('@')[0]}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {totalScore > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                                    <Trophy className="h-5 w-5 text-yellow-400" />
                                    <span className="font-bold text-yellow-400">{totalScore}</span>
                                    <span className="text-gray-400 text-sm hidden sm:inline">Score</span>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {hasNoAccounts ? (
                <Card className="text-center py-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardContent>
                        <div className="relative inline-block">
                            <Zap className="mx-auto h-20 w-20 text-yellow-500 animate-bounce" />
                            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
                        </div>
                        <h2 className="text-3xl font-bold mt-6 mb-2">Complete Your Profile!</h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">Connect your coding profiles and upload your resume to unlock powerful insights about your developer journey.</p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <Link href="/networks">
                                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                    <Zap className="h-4 w-4" />
                                    Connect Accounts
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* LeetCode Card */}
                        <Card className="group relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-colors"></div>
                            <CardHeader className="pb-2 relative">
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-yellow-500/20">
                                            <Code className="h-5 w-5 text-yellow-500" />
                                        </div>
                                        LeetCode
                                    </div>
                                    {getLinkedUsername('leetcode') && (
                                        <a href={`https://leetcode.com/${getLinkedUsername('leetcode')}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 text-gray-500 hover:text-yellow-400 transition-colors" />
                                        </a>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative">
                                {getLinkedUsername('leetcode') ? (
                                    statsLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-6 w-6 text-yellow-500" />
                                            <span className="text-gray-400 text-sm">Loading...</span>
                                        </div>
                                    ) : leetcodeStats ? (
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <div className="text-4xl font-bold text-yellow-400">{leetcodeStats.totalSolved}</div>
                                                    <div className="text-sm text-gray-400 mt-1">Problems Solved</div>
                                                </div>
                                                {leetcodeStats.ranking && leetcodeStats.ranking !== 'N/A' && (
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-yellow-400">#{typeof leetcodeStats.ranking === 'number' ? leetcodeStats.ranking.toLocaleString() : leetcodeStats.ranking}</div>
                                                        <div className="text-xs text-gray-500">Rank</div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, (leetcodeStats.totalSolved / (leetcodeStats.totalQuestions || 3000)) * 100)}%` }}
                                                    />
                                                </div>
                                                <div className="text-xs text-gray-500">{leetcodeStats.totalSolved} / {leetcodeStats.totalQuestions || 3000} problems</div>
                                            </div>
                                            {/* Difficulty Breakdown */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                                                    <div className="text-lg font-bold text-green-400">{leetcodeStats.easySolved}</div>
                                                    <div className="text-xs text-gray-500">Easy</div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                                                    <div className="text-lg font-bold text-yellow-400">{leetcodeStats.mediumSolved}</div>
                                                    <div className="text-xs text-gray-500">Medium</div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                                                    <div className="text-lg font-bold text-red-400">{leetcodeStats.hardSolved}</div>
                                                    <div className="text-xs text-gray-500">Hard</div>
                                                </div>
                                            </div>
                                            {/* Contest & Streak */}
                                            {(leetcodeStats.contestRating || leetcodeStats.streak) && (
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                                                    {leetcodeStats.contestRating && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded-lg">
                                                            <Trophy className="h-3.5 w-3.5 text-purple-400" />
                                                            <span className="text-xs text-purple-400 font-medium">{leetcodeStats.contestRating}</span>
                                                        </div>
                                                    )}
                                                    {(leetcodeStats.contestsAttended ?? 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-lg">
                                                            <Target className="h-3.5 w-3.5 text-blue-400" />
                                                            <span className="text-xs text-blue-400 font-medium">{leetcodeStats.contestsAttended} contests</span>
                                                        </div>
                                                    )}
                                                    {(leetcodeStats.streak ?? 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded-lg">
                                                            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                                                            <span className="text-xs text-orange-400 font-medium">{leetcodeStats.streak}d streak</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* Badges */}
                                            {leetcodeStats.badges && leetcodeStats.badges.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {leetcodeStats.badges.slice(0, 3).map((badge: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">{badge}</span>
                                                    ))}
                                                    {leetcodeStats.badges.length > 3 && (
                                                        <span className="px-2 py-0.5 text-xs text-gray-500">+{leetcodeStats.badges.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : <div className="text-gray-500">Unable to load</div>
                                ) : (
                                    <Link href="/networks" className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors group/link">
                                        <span>Connect</span>
                                        <ChevronRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* GitHub Card */}
                        <Card className="group relative overflow-hidden bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
                            <CardHeader className="pb-2 relative">
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-gray-500/20">
                                            <Github className="h-5 w-5" />
                                        </div>
                                        GitHub
                                    </div>
                                    {getLinkedUsername('github') && (
                                        <a href={`https://github.com/${getLinkedUsername('github')}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 text-gray-500 hover:text-white transition-colors" />
                                        </a>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative">
                                {getLinkedUsername('github') ? (
                                    statsLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-6 w-6" />
                                            <span className="text-gray-400 text-sm">Loading...</span>
                                        </div>
                                    ) : githubStats ? (
                                        <div className="space-y-4">
                                            {/* Main Stats Grid */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center p-2 bg-white/5 rounded-lg">
                                                    <div className="text-2xl font-bold">{githubStats.publicRepos}</div>
                                                    <div className="text-xs text-gray-500">Repos</div>
                                                </div>
                                                <div className="text-center p-2 bg-yellow-500/10 rounded-lg">
                                                    <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                                                        <Star className="h-4 w-4" /> {githubStats.totalStars}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Stars</div>
                                                </div>
                                                <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-1">
                                                        <Users className="h-4 w-4" /> {githubStats.followers}
                                                    </div>
                                                    <div className="text-xs text-gray-500">Followers</div>
                                                </div>
                                            </div>
                                            {/* Top Languages */}
                                            {githubStats.topLanguages && githubStats.topLanguages.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="text-xs text-gray-500 uppercase">Top Languages</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {githubStats.topLanguages.slice(0, 5).map((lang: { language: string; repos: number }, i: number) => (
                                                            <span
                                                                key={i}
                                                                className={`px-2 py-0.5 text-xs rounded-full ${i === 0
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-white/5 text-gray-400'
                                                                    }`}
                                                            >
                                                                {lang.language} ({lang.repos})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Top Repos */}
                                            {githubStats.topRepos && githubStats.topRepos.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="text-xs text-gray-500 uppercase">Top Repositories</div>
                                                    <div className="space-y-1">
                                                        {githubStats.topRepos.slice(0, 3).map((repo: { name: string; url: string; stars: number; language: string }, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={repo.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                            >
                                                                <span className="text-sm truncate max-w-[120px]">{repo.name}</span>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    {repo.language && <span className="text-gray-500">{repo.language}</span>}
                                                                    {repo.stars > 0 && (
                                                                        <span className="flex items-center gap-0.5 text-yellow-400">
                                                                            <Star className="h-3 w-3" /> {repo.stars}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : <div className="text-gray-500">Unable to load</div>
                                ) : (
                                    <Link href="/networks" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group/link">
                                        <span>Connect</span>
                                        <ChevronRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* GFG Card */}
                        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
                            <CardHeader className="pb-2 relative">
                                <CardTitle className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-green-500/20">
                                            <Terminal className="h-5 w-5 text-green-500" />
                                        </div>
                                        GFG
                                    </div>
                                    {getLinkedUsername('geeksforgeeks') && (
                                        <a href={`https://www.geeksforgeeks.org/user/${getLinkedUsername('geeksforgeeks')}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 text-gray-500 hover:text-green-400 transition-colors" />
                                        </a>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative">
                                {getLinkedUsername('geeksforgeeks') ? (
                                    statsLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-6 w-6 text-green-500" />
                                            <span className="text-gray-400 text-sm">Loading...</span>
                                        </div>
                                    ) : gfgStats ? (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-4xl font-bold text-green-400">{gfgStats.codingScore}</div>
                                                <div className="text-sm text-gray-400 mt-1">Coding Score</div>
                                            </div>
                                            <div className="px-2 py-1 bg-green-500/20 rounded inline-block">
                                                <span className="text-green-400 text-sm">{gfgStats.problemsSolved} solved</span>
                                            </div>
                                        </div>
                                    ) : <div className="text-gray-500">Unable to load</div>
                                ) : (
                                    <Link href="/networks" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors group/link">
                                        <span>Connect</span>
                                        <ChevronRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Resume ATS Card */}
                        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20 transition-colors"></div>
                            <CardHeader className="pb-2 relative">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <Award className="h-5 w-5 text-purple-500" />
                                    </div>
                                    Resume ATS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="relative">
                                {profile?.resume_url ? (
                                    statsLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="animate-pulse h-6 w-6 text-purple-500" />
                                            <span className="text-gray-400 text-sm">Analyzing...</span>
                                        </div>
                                    ) : resumeAnalysisError ? (
                                        <div className="space-y-1">
                                            <div className="text-sm text-red-400">Analysis failed</div>
                                            <div className="text-xs text-gray-500">{resumeAnalysisError}</div>
                                        </div>
                                    ) : resumeAnalysis ? (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-4xl font-bold text-purple-400">
                                                    {resumeAnalysis.atsScore}
                                                    <span className="text-xl text-gray-500">/100</span>
                                                </div>
                                                <div className="text-sm text-gray-400 mt-1">ATS Score</div>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                                                    style={{ width: `${resumeAnalysis.atsScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : <div className="text-gray-500">Pending</div>
                                ) : (
                                    <div className="text-purple-400 text-sm">Upload below ↓</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resume Upload Section */}
                    <Card className="border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-400" />
                                Resume
                            </CardTitle>
                            <CardDescription className="text-gray-400">Upload your resume for AI-powered ATS analysis</CardDescription>
                            {uploadSuccess && (
                                <div className="mt-2 p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center">
                                    ✓ Resume uploaded successfully!
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {resumeAnalysisError && (
                                <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-300">
                                    {resumeAnalysisError}
                                </div>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                                {profile?.resume_url ? (
                                    <>
                                        <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="gap-2">
                                                <FileText className="h-4 w-4" />
                                                View Resume
                                            </Button>
                                        </a>
                                        <div>
                                            <input
                                                id="resume-upload-update"
                                                type="file"
                                                accept=".pdf,application/pdf"
                                                onChange={handleResumeUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                            <label htmlFor="resume-upload-update" className={uploading ? "pointer-events-none" : "cursor-pointer"}>
                                                <Button type="button" variant="outline" isLoading={uploading} className="gap-2" onClick={() => document.getElementById('resume-upload-update')?.click()}>
                                                    <Upload className="h-4 w-4" />
                                                    Update
                                                </Button>
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <input
                                            id="resume-upload-new"
                                            type="file"
                                            accept=".pdf,application/pdf"
                                            onChange={handleResumeUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                        <label htmlFor="resume-upload-new" className={uploading ? "pointer-events-none" : "cursor-pointer"}>
                                            <Button type="button" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600" isLoading={uploading} onClick={() => document.getElementById('resume-upload-new')?.click()}>
                                                <Upload className="h-4 w-4" />
                                                Upload Resume
                                            </Button>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Resume Insights */}
                    {resumeAnalysis && (
                        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                                        <Sparkles className="h-5 w-5 text-purple-400" />
                                    </div>
                                    AI Resume Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Summary */}
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="text-sm font-semibold text-purple-400 mb-2 uppercase tracking-wider">Professional Summary</h4>
                                    <p className="text-gray-200 leading-relaxed">{resumeAnalysis.summary}</p>
                                </div>

                                {/* Skills */}
                                {resumeAnalysis.topSkills.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wider">Top Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {resumeAnalysis.topSkills.map((skill, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {resumeAnalysis.suggestions.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wider">💡 Suggestions</h4>
                                        <ul className="space-y-2">
                                            {resumeAnalysis.suggestions.map((suggestion, i) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                                    <span className="text-yellow-400 font-bold">{i + 1}.</span>
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Profile Analysis */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-400 mb-4">AI Profile Analysis</h3>
                        <ProfileInsightsCard
                            insights={profileInsights}
                            loading={insightsLoading}
                        />
                    </div>

                    {/* Research Profile */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-400 mb-4">Research Profile</h3>
                        <ResearchProfileSection userId={user?.id} />
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-400 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/feed">
                                <Card className="group hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer border-white/10 hover:border-blue-500/30">
                                    <CardContent className="flex items-center p-5">
                                        <div className="p-3 rounded-xl bg-blue-500/20 mr-4 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold group-hover:text-blue-400 transition-colors">Browse Feed</div>
                                            <div className="text-sm text-gray-400">Find teammates</div>
                                        </div>
                                        <ChevronRight className="ml-auto h-5 w-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/networks">
                                <Card className="group hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-orange-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer border-white/10 hover:border-yellow-500/30">
                                    <CardContent className="flex items-center p-5">
                                        <div className="p-3 rounded-xl bg-yellow-500/20 mr-4 group-hover:scale-110 transition-transform">
                                            <Zap className="h-6 w-6 text-yellow-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold group-hover:text-yellow-400 transition-colors">Connect More</div>
                                            <div className="text-sm text-gray-400">Link profiles</div>
                                        </div>
                                        <ChevronRight className="ml-auto h-5 w-5 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/platforms">
                                <Card className="group hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer border-white/10 hover:border-green-500/30">
                                    <CardContent className="flex items-center p-5">
                                        <div className="p-3 rounded-xl bg-green-500/20 mr-4 group-hover:scale-110 transition-transform">
                                            <Target className="h-6 w-6 text-green-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold group-hover:text-green-400 transition-colors">Hackathons</div>
                                            <div className="text-sm text-gray-400">Competitions</div>
                                        </div>
                                        <ChevronRight className="ml-auto h-5 w-5 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/research">
                                <Card className="group hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer border-white/10 hover:border-cyan-500/30">
                                    <CardContent className="flex items-center p-5">
                                        <div className="p-3 rounded-xl bg-cyan-500/20 mr-4 group-hover:scale-110 transition-transform">
                                            <Microscope className="h-6 w-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <div className="font-bold group-hover:text-cyan-400 transition-colors">Research Hub</div>
                                            <div className="text-sm text-gray-400">Find collaborators</div>
                                        </div>
                                        <ChevronRight className="ml-auto h-5 w-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
