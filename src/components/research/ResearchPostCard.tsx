import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Calendar, BookOpen, Users, Microscope } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

type ResearchPostCardProps = {
    post: {
        id: string
        created_by: string
        title: string
        research_domain: string
        required_skills: string[] | null
        publication_target: string | null
        team_size: number
        deadline: string | null
        paper_type: 'survey' | 'experimental' | 'theoretical'
        profiles?: {
            full_name: string | null
            username: string | null
        }
    }
}

export function ResearchPostCard({ post }: ResearchPostCardProps) {
    const { user } = useAuth()
    const isOwner = user?.id === post.created_by

    return (
        <Card className="group relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-white/90 dark:bg-zinc-950/80 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.15),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.10),transparent_45%)]" />
            <CardHeader className="relative z-10">
                <CardTitle className="text-xl text-foreground mb-1 leading-tight">{post.title}</CardTitle>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 inline-flex items-center gap-1">
                        <Microscope className="h-3 w-3" /> {post.research_domain}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-black/10 dark:border-white/15 capitalize">
                        {post.paper_type}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
                <div className="grid grid-cols-1 gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        <span>Target: {post.publication_target || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        <span>Team Size: {post.team_size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        <span>Deadline: {post.deadline ? new Date(post.deadline).toLocaleDateString() : 'Flexible'}</span>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Created by: {post.profiles?.full_name || post.profiles?.username || 'Research Lead'}
                </div>

                {(post.required_skills || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {(post.required_skills || []).slice(0, 6).map(skill => (
                            <span key={skill} className="px-2 py-1 text-xs rounded-md bg-yellow-400/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/25">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                <div className={`grid ${isOwner ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                    <Link href={`/research/${post.id}`}>
                        <Button variant="outline" className="w-full border-yellow-500/35 text-zinc-800 dark:text-zinc-100 hover:bg-yellow-400/10">View Details</Button>
                    </Link>
                    {!isOwner && (
                        <Link href={`/research/apply/${post.id}`}>
                            <Button className="w-full">Apply</Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
