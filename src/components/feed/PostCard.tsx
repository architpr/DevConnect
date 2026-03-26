import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Calendar, User, Eye } from "lucide-react"
import Link from "next/link"

type Post = {
    id: string
    title: string
    description: string
    hackathon_name: string | null
    skills_required: string[] | null
    created_at: string
    user_id: string
    profiles?: {
        full_name: string
        username: string
        avatar_url: string
    }
}

export function PostCard({ post, currentUserId, onApply }: { post: Post, currentUserId?: string, onApply: (postId: string) => void }) {
    const isOwner = currentUserId === post.user_id

    return (
        <Card className="hover:border-blue-500/30 transition-colors">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-white mb-1">{post.title}</CardTitle>
                        {post.hackathon_name && (
                            <div className="flex items-center text-sm text-blue-400">
                                <Calendar className="mr-1 h-3 w-3" />
                                {post.hackathon_name}
                            </div>
                        )}
                    </div>
                    {post.profiles && (
                        <div className="flex items-center text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                            <User className="mr-1 h-3 w-3" />
                            {post.profiles.username || 'Anonymous'}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {post.description}
                </p>
                <div className="flex flex-wrap gap-2">
                    {post.skills_required?.map(skill => (
                        <span key={skill} className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {skill}
                        </span>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                {isOwner ? (
                    <Link href={`/post/${post.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                            <Eye className="mr-2 h-4 w-4" /> View Applications
                        </Button>
                    </Link>
                ) : (
                    <Button size="sm" className="w-full" onClick={() => onApply(post.id)}>
                        Apply to Join
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
