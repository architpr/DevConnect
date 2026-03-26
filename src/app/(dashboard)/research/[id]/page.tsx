"use client"

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Loader2, Calendar, Users, BookOpen, ArrowLeft } from 'lucide-react'

type PostDetail = {
    id: string
    title: string
    description: string
    research_domain: string
    required_skills: string[] | null
    required_tools: string[] | null
    publication_target: string | null
    team_size: number
    paper_type: 'survey' | 'experimental' | 'theoretical'
    deadline: string | null
    status: 'open' | 'closed'
    created_by: string
    profiles?: {
        id: string
        full_name: string | null
        username: string | null
        avatar_url: string | null
        resume_url: string | null
    }
}

export default function ResearchPostDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [post, setPost] = useState<PostDetail | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const run = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/research/posts/${resolvedParams.id}`)
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data?.error || 'Failed to load research post')
                }
                setPost(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load research post')
                setPost(null)
            } finally {
                setLoading(false)
            }
        }

        run()
    }, [resolvedParams.id])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-cyan-500 h-8 w-8" />
                <p className="text-gray-400">Loading research post...</p>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="space-y-4">
                <Link href="/research">
                    <Button variant="ghost" className="pl-0 hover:bg-transparent">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to ResearchHub
                    </Button>
                </Link>
                <Card>
                    <CardContent className="p-6 text-red-400">{error || 'Research post not found'}</CardContent>
                </Card>
            </div>
        )
    }

    const isOwner = user?.id === post.created_by

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/research">
                <Button variant="ghost" className="pl-0 hover:bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to ResearchHub
                </Button>
            </Link>

            <Card className="border-cyan-500/20">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        {post.title}
                    </CardTitle>
                    <CardDescription>
                        {post.research_domain} • {post.paper_type} • Created by {post.profiles?.full_name || post.profiles?.username || 'Research Lead'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{post.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-cyan-400" />
                            Target: {post.publication_target || 'Not specified'}
                        </div>
                        <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 flex items-center gap-2">
                            <Users className="h-4 w-4 text-yellow-400" />
                            Team Size: {post.team_size}
                        </div>
                        <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-300 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-pink-400" />
                            Deadline: {post.deadline ? new Date(post.deadline).toLocaleDateString() : 'Flexible'}
                        </div>
                    </div>

                    {(post.required_skills || []).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {(post.required_skills || []).map(skill => (
                                    <span key={skill} className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(post.required_tools || []).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-purple-400 mb-2 uppercase tracking-wider">Preferred Tools</h4>
                            <div className="flex flex-wrap gap-2">
                                {(post.required_tools || []).map(tool => (
                                    <span key={tool} className="px-2 py-1 text-xs rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">{tool}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        {!isOwner && post.status === 'open' && (
                            <Link href={`/research/apply/${post.id}`}>
                                <Button>Apply to Research</Button>
                            </Link>
                        )}
                        {isOwner && (
                            <Link href="/research/requests">
                                <Button variant="outline">View Applicants</Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
