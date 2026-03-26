"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader2, Check, X, ExternalLink, FileText, Mail } from 'lucide-react'

type ResearchApplication = {
    id: string
    motivation: string
    research_experience: string | null
    status: 'pending' | 'accepted' | 'rejected'
    created_at: string
    research_post_id: string
    applicant_id: string
    applicant?: {
        id: string
        full_name: string | null
        username: string | null
        avatar_url: string | null
        resume_url: string | null
        email?: string | null
        research_profile?: {
            research_interests: string[] | null
            research_experience_level: string | null
            research_tools: string[] | null
        } | null
        publications?: {
            id: string
            title: string
            journal_or_conference: string
            year: number
            doi_link: string | null
            github_repo: string | null
            role: string
        }[]
        linked_accounts?: {
            platform: string
            platform_username: string
        }[]
    }
}

export default function ResearchRequestsPage() {
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [applications, setApplications] = useState<ResearchApplication[]>([])
    const [recentlyAcceptedIds, setRecentlyAcceptedIds] = useState<string[]>([])

    const loadApplications = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/research/applications?mode=lead')
            const data = await res.json()
            if (res.ok) {
                setApplications(data.applications || [])
            } else {
                setApplications([])
            }
        } catch {
            setApplications([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadApplications()
    }, [])

    const pending = useMemo(
        () => applications.filter(a => a.status === 'pending' || recentlyAcceptedIds.includes(a.id)),
        [applications, recentlyAcceptedIds]
    )
    const processed = useMemo(
        () => applications.filter(a => a.status !== 'pending' && !recentlyAcceptedIds.includes(a.id)),
        [applications, recentlyAcceptedIds]
    )

    const buildApplicantGmailCompose = (app: ResearchApplication) => {
        const to = app.applicant?.email?.trim()
        if (!to) return null

        const applicantName = app.applicant?.full_name || app.applicant?.username || 'Applicant'
        const subject = encodeURIComponent('Research Collaboration - Next Steps')
        const body = encodeURIComponent(
            `Hi ${applicantName},\n\nCongratulations! Your research application has been accepted.\n\nPlease share your availability so we can discuss the next steps.\n\nBest regards,`
        )

        return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subject}&body=${body}`
    }

    const handleDecision = async (applicationId: string, status: 'accepted' | 'rejected') => {
        setUpdating(applicationId)
        try {
            const res = await fetch('/api/research/applications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, status }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data?.error || 'Failed to update status')
            }

            setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status } : app))
            if (status === 'accepted') {
                setRecentlyAcceptedIds(prev => prev.includes(applicationId) ? prev : [...prev, applicationId])
            } else {
                setRecentlyAcceptedIds(prev => prev.filter(id => id !== applicationId))
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to update status')
        } finally {
            setUpdating(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-cyan-500 h-8 w-8" />
                <p className="text-gray-400">Loading research applications...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    Research Requests
                </h1>
                <p className="text-gray-400 mt-2">Review contributors for your ResearchHub posts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-yellow-400">{pending.length}</div>
                        <div className="text-sm text-gray-400">Pending</div>
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

            {applications.length === 0 ? (
                <Card className="text-center py-16 bg-gradient-to-br from-gray-500/5 to-gray-600/5 border-gray-500/20">
                    <CardContent>
                        <h2 className="text-2xl font-bold mb-2">No Research Applications Yet</h2>
                        <p className="text-gray-400">Create a research post to start receiving contributor applications.</p>
                        <Link href="/research/create" className="inline-block mt-4">
                            <Button>Create Research Post</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {pending.map(app => (
                        <Card key={app.id} className="border-cyan-500/20">
                            <CardHeader>
                                <CardTitle className="text-xl">{app.applicant?.full_name || app.applicant?.username || 'Applicant'}</CardTitle>
                                <CardDescription>
                                    Applied on {new Date(app.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <h4 className="text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">Motivation</h4>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.motivation}</p>
                                </div>

                                {app.research_experience && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-400 mb-2 uppercase tracking-wider">Research Experience</h4>
                                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{app.research_experience}</p>
                                    </div>
                                )}

                                {app.applicant?.research_profile && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-gray-500">Experience Level</div>
                                            <div className="text-gray-200">{app.applicant.research_profile.research_experience_level || 'Not specified'}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                            <div className="text-gray-500">Research Interests</div>
                                            <div className="text-gray-200">{(app.applicant.research_profile.research_interests || []).join(', ') || 'Not specified'}</div>
                                        </div>
                                    </div>
                                )}

                                {(app.applicant?.publications || []).length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-yellow-400 mb-2 uppercase tracking-wider">Publications</h4>
                                        <div className="space-y-2">
                                            {(app.applicant?.publications || []).slice(0, 3).map(pub => (
                                                <div key={pub.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                                                    <div className="font-medium text-gray-200">{pub.title}</div>
                                                    <div className="text-gray-500">{pub.journal_or_conference} • {pub.year}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {(app.applicant?.linked_accounts || []).map(acc => (
                                        <a
                                            key={`${acc.platform}-${acc.platform_username}`}
                                            href={acc.platform === 'github' ? `https://github.com/${acc.platform_username}` : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-sm text-gray-300"
                                        >
                                            {acc.platform}: {acc.platform_username}
                                            {acc.platform === 'github' && <ExternalLink className="h-3.5 w-3.5 ml-2" />}
                                        </a>
                                    ))}
                                    {app.applicant?.resume_url && (
                                        <a href={app.applicant.resume_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="gap-2">
                                                <FileText className="h-4 w-4" />
                                                Resume
                                            </Button>
                                        </a>
                                    )}
                                </div>

                                {app.status === 'pending' ? (
                                    <div className="flex gap-3">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            isLoading={updating === app.id}
                                            onClick={() => handleDecision(app.id, 'accepted')}
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Accept
                                        </Button>
                                        <Button
                                            className="bg-red-600 hover:bg-red-700"
                                            isLoading={updating === app.id}
                                            onClick={() => handleDecision(app.id, 'rejected')}
                                        >
                                            <X className="mr-2 h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center flex-wrap gap-3">
                                        <span className="text-sm font-medium px-2.5 py-1 rounded-md border border-green-500/30 bg-green-500/10 text-green-400">
                                            Accepted
                                        </span>
                                        {(() => {
                                            const gmailUrl = buildApplicantGmailCompose(app)
                                            if (!gmailUrl) {
                                                return (
                                                    <div className="space-y-1">
                                                        <Button variant="outline" className="gap-2" disabled title="Applicant email not available">
                                                            <Mail className="h-4 w-4" />
                                                            Mail Applicant
                                                        </Button>
                                                        <p className="text-xs text-gray-500">Applicant email is missing in profile.</p>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" className="gap-2 border-yellow-500/35 text-zinc-800 dark:text-zinc-100 hover:bg-yellow-400/10">
                                                        <Mail className="h-4 w-4" />
                                                        Mail Applicant (Gmail)
                                                    </Button>
                                                </a>
                                            )
                                        })()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {processed.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-400">Processed Applications</h2>
                            {processed.map(app => (
                                <Card key={app.id} className="border-white/10">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-200">{app.applicant?.full_name || app.applicant?.username || 'Applicant'}</div>
                                            <div className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {app.status === 'accepted' && (
                                                (() => {
                                                    const gmailUrl = buildApplicantGmailCompose(app)
                                                    if (!gmailUrl) {
                                                        return (
                                                            <div className="space-y-1">
                                                                <Button variant="outline" className="gap-2" disabled title="Applicant email not available">
                                                                    <Mail className="h-4 w-4" />
                                                                    Mail Applicant
                                                                </Button>
                                                                <p className="text-xs text-gray-500">Applicant email missing.</p>
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="outline" className="gap-2 border-yellow-500/35 text-zinc-800 dark:text-zinc-100 hover:bg-yellow-400/10">
                                                                <Mail className="h-4 w-4" />
                                                                Mail Applicant (Gmail)
                                                            </Button>
                                                        </a>
                                                    )
                                                })()
                                            )}

                                            <span className={`text-sm font-medium ${app.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                                                {app.status}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
