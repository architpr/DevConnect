"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Code, Github, Terminal, ExternalLink, Trophy, Flame, Target, GitFork, Star, Clock } from "lucide-react"
import Link from "next/link"

export type LeetCodeStats = {
    username: string
    totalSolved: number
    easySolved: number
    mediumSolved: number
    hardSolved: number
    totalQuestions?: number
    contestRating?: number | null
    contestRanking?: number | null
    contestsAttended?: number
    ranking?: string | number
    badges?: string[]
    streak?: number
    profileUrl?: string
}

export type GitHubStats = {
    username: string
    name: string
    avatarUrl: string
    bio: string | null
    publicRepos: number
    followers: number
    following: number
    totalStars: number
    totalForks?: number
    topLanguages?: { language: string; repos: number }[]
    primaryLanguage?: string | null
    topRepos?: {
        name: string
        description: string | null
        url: string
        stars: number
        forks: number
        language: string | null
    }[]
    accountAgeYears?: number
    profileUrl: string
}

export type GFGStats = {
    username: string
    codingScore: number
    problemsSolved: number
    monthlyScore?: number
    streak?: number
    instituteRank?: string
    profileUrl: string
}

export function LeetCodeStatsCard({ stats, loading }: { stats: LeetCodeStats | null; loading?: boolean }) {
    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 animate-pulse">
                <CardContent className="p-6 h-48" />
            </Card>
        )
    }

    if (!stats) {
        return (
            <Card className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-400">
                        <Code className="h-5 w-5 text-yellow-500" /> LeetCode
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-gray-500 text-sm">Not connected</div>
                </CardContent>
            </Card>
        )
    }

    const progressPercent = stats.totalQuestions ? (stats.totalSolved / stats.totalQuestions) * 100 : 0

    return (
        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <Code className="h-5 w-5 text-yellow-500" /> LeetCode
                    </span>
                    <Link href={stats.profileUrl || `https://leetcode.com/${stats.username}`} target="_blank">
                        <ExternalLink className="h-4 w-4 text-gray-500 hover:text-yellow-400 transition-colors" />
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Stats */}
                <div className="flex items-end gap-4">
                    <div>
                        <div className="text-4xl font-bold text-yellow-400">{stats.totalSolved}</div>
                        <div className="text-sm text-gray-400">Problems Solved</div>
                    </div>
                    {stats.ranking && stats.ranking !== 'N/A' && (
                        <div className="text-sm text-gray-400">
                            Rank: <span className="text-yellow-400 font-medium">#{typeof stats.ranking === 'number' ? stats.ranking.toLocaleString() : stats.ranking}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500">{stats.totalSolved} / {stats.totalQuestions || 3000} problems</div>
                </div>

                {/* Difficulty Breakdown */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                        <div className="text-lg font-bold text-green-400">{stats.easySolved}</div>
                        <div className="text-xs text-gray-400">Easy</div>
                    </div>
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                        <div className="text-lg font-bold text-yellow-400">{stats.mediumSolved}</div>
                        <div className="text-xs text-gray-400">Medium</div>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                        <div className="text-lg font-bold text-red-400">{stats.hardSolved}</div>
                        <div className="text-xs text-gray-400">Hard</div>
                    </div>
                </div>

                {/* Contest & Extra Stats */}
                {(stats.contestRating || stats.streak) && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                        {stats.contestRating && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Trophy className="h-4 w-4 text-purple-400" />
                                <span className="text-gray-400">Rating:</span>
                                <span className="font-medium text-purple-400">{stats.contestRating}</span>
                            </div>
                        )}
                        {stats.contestsAttended && stats.contestsAttended > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Target className="h-4 w-4 text-blue-400" />
                                <span className="text-gray-400">Contests:</span>
                                <span className="font-medium text-blue-400">{stats.contestsAttended}</span>
                            </div>
                        )}
                        {stats.streak && stats.streak > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                                <Flame className="h-4 w-4 text-orange-400" />
                                <span className="text-gray-400">Streak:</span>
                                <span className="font-medium text-orange-400">{stats.streak} days</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Badges */}
                {stats.badges && stats.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {stats.badges.slice(0, 4).map((badge, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                                {badge}
                            </span>
                        ))}
                        {stats.badges.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-gray-500">+{stats.badges.length - 4} more</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function GitHubStatsCard({ stats, loading }: { stats: GitHubStats | null; loading?: boolean }) {
    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30 animate-pulse">
                <CardContent className="p-6 h-48" />
            </Card>
        )
    }

    if (!stats) {
        return (
            <Card className="bg-gradient-to-br from-gray-500/5 to-gray-600/5 border-gray-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-400">
                        <Github className="h-5 w-5" /> GitHub
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-gray-500 text-sm">Not connected</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <Github className="h-5 w-5" /> GitHub
                    </span>
                    <Link href={stats.profileUrl} target="_blank">
                        <ExternalLink className="h-4 w-4 text-gray-500 hover:text-white transition-colors" />
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{stats.publicRepos}</div>
                        <div className="text-xs text-gray-400">Repos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                            <Star className="h-4 w-4" /> {stats.totalStars}
                        </div>
                        <div className="text-xs text-gray-400">Stars</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.followers}</div>
                        <div className="text-xs text-gray-400">Followers</div>
                    </div>
                </div>

                {/* Top Languages */}
                {stats.topLanguages && stats.topLanguages.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 uppercase">Top Languages</div>
                        <div className="flex flex-wrap gap-1.5">
                            {stats.topLanguages.map((lang, i) => (
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
                {stats.topRepos && stats.topRepos.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 uppercase">Top Repositories</div>
                        <div className="space-y-1.5">
                            {stats.topRepos.slice(0, 3).map((repo, i) => (
                                <Link
                                    key={i}
                                    href={repo.url}
                                    target="_blank"
                                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate group-hover:text-blue-400 transition-colors">
                                            {repo.name}
                                        </div>
                                        {repo.language && (
                                            <div className="text-xs text-gray-500">{repo.language}</div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        {repo.stars > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Star className="h-3 w-3 text-yellow-400" /> {repo.stars}
                                            </span>
                                        )}
                                        {repo.forks > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <GitFork className="h-3 w-3" /> {repo.forks}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Account Age */}
                {stats.accountAgeYears !== undefined && stats.accountAgeYears > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-white/10">
                        <Clock className="h-3 w-3" />
                        <span>{stats.accountAgeYears}+ years on GitHub</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function GFGStatsCard({ stats, loading }: { stats: GFGStats | null; loading?: boolean }) {
    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 animate-pulse">
                <CardContent className="p-6 h-48" />
            </Card>
        )
    }

    if (!stats) {
        return (
            <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-400">
                        <Terminal className="h-5 w-5 text-green-500" /> GeeksForGeeks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-gray-500 text-sm">Not connected</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-green-500" /> GeeksForGeeks
                    </span>
                    <Link href={stats.profileUrl} target="_blank">
                        <ExternalLink className="h-4 w-4 text-gray-500 hover:text-green-400 transition-colors" />
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-4xl font-bold text-green-400">{stats.codingScore}</div>
                        <div className="text-sm text-gray-400">Coding Score</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-emerald-400">{stats.problemsSolved}</div>
                        <div className="text-sm text-gray-400">Problems Solved</div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                    {stats.monthlyScore && stats.monthlyScore > 0 && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Target className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-400">Monthly:</span>
                            <span className="font-medium text-blue-400">{stats.monthlyScore}</span>
                        </div>
                    )}
                    {stats.streak && stats.streak > 0 && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Flame className="h-4 w-4 text-orange-400" />
                            <span className="text-gray-400">Streak:</span>
                            <span className="font-medium text-orange-400">{stats.streak} days</span>
                        </div>
                    )}
                    {stats.instituteRank && stats.instituteRank !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Trophy className="h-4 w-4 text-purple-400" />
                            <span className="text-gray-400">Institute:</span>
                            <span className="font-medium text-purple-400">#{stats.instituteRank}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
