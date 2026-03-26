"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PostCard } from "@/components/feed/PostCard"
import { Plus, Search, Loader2 } from "lucide-react"
import Link from "next/link"

export default function FeedPage() {
    const { user } = useAuth()
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        const fetchPosts = async () => {
            const { data } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        full_name,
                        username,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false })

            if (data) setPosts(data)
            setLoading(false)
        }

        fetchPosts()
    }, [supabase])

    const handleApply = async (postId: string) => {
        if (!user) return
        try {
            const { error } = await supabase
                .from('applications')
                .insert({
                    post_id: postId,
                    candidate_id: user.id
                })

            if (error) {
                if (error.code === '23505') { // Unique violation
                    alert("You have already applied to this post.")
                } else {
                    throw error
                }
            } else {
                alert("Application sent successfully!")
            }
        } catch (error: unknown) {
            alert(`Error applying: ${(error as Error).message}`)
        }
    }

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase()) ||
        post.skills_required?.some((skill: string) => skill.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        BuildBoard
                    </h1>
                    <p className="text-gray-400 mt-1">Find your next dream team or hackathon partner.</p>
                </div>
                <Link href="/feed/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Post
                    </Button>
                </Link>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search by title, skill, or keyword..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                            onApply={handleApply}
                        />
                    ))}

                    {filteredPosts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No posts found. Be the first to create one!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
