"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, Target, Brain } from "lucide-react"

type ProfileInsights = {
    strengths: string[]
    improvements: string[]
    careerPaths: string[]
    skillGaps: { skill: string; priority: 'High' | 'Medium' | 'Low' }[]
    overallScore: number
    summary: string
}

type ProfileInsightsCardProps = {
    insights: ProfileInsights | null
    loading?: boolean
    error?: string
}

export function ProfileInsightsCard({ insights, loading, error }: ProfileInsightsCardProps) {
    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-purple-500/30">
                <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    <div className="text-center">
                        <p className="text-gray-300 font-medium">Analyzing Profile with AI...</p>
                        <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !insights) {
        return (
            <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border-gray-500/30">
                <CardContent className="p-6 text-center text-gray-500">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>AI analysis unavailable</p>
                    <p className="text-xs mt-1">{error || "Connect accounts to enable AI insights"}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary & Score */}
            <Card className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-purple-500/30 overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Brain className="h-5 w-5 text-purple-400" />
                        </div>
                        AI Profile Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-300">{insights.summary}</p>
                </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                            Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {insights.strengths.map((strength, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-300">{strength}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Areas for Improvement */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertCircle className="h-5 w-5 text-amber-400" />
                            Areas for Improvement
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {insights.improvements.map((improvement, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-gray-300">{improvement}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Career Recommendations */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-cyan-400" />
                        Career Recommendations
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Based on skills and experience, suitable career paths:</p>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {insights.careerPaths.map((path, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400"
                            >
                                {path}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/30">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="h-5 w-5 text-pink-400" />
                        Identified Skill Gaps
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Skills that would strengthen your profile for target roles:</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.skillGaps.map((gap, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                                <span className="text-sm text-gray-300">{gap.skill}</span>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${gap.priority === 'High'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : gap.priority === 'Medium'
                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        }`}
                                >
                                    {gap.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
