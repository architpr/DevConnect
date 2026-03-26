"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function CreatePostPage() {
    const { user } = useAuth()
    const supabase = createClient()
    const router = useRouter()

    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [hackathon, setHackathon] = useState("")
    const [skills, setSkills] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0)

            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    title,
                    description,
                    hackathon_name: hackathon,
                    skills_required: skillsArray
                })

            if (error) throw error

            router.push('/feed')
            router.refresh()

        } catch (error: unknown) {
            alert(`Error creating post: ${(error as Error).message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-white" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to BuildBoard
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Create Team Post
                    </CardTitle>
                    <CardDescription>
                        Looking for teammates? Post your requirements here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Post Title"
                            placeholder="e.g. Frontend Dev needed for AI Hackathon"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Description</label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white transition-all duration-200"
                                placeholder="Describe your project idea and what you are looking for..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <Input
                            label="Hackathon Name (Optional)"
                            placeholder="e.g. Smart India Hackathon 2024"
                            value={hackathon}
                            onChange={e => setHackathon(e.target.value)}
                        />

                        <Input
                            label="Required Skills (Comma separated)"
                            placeholder="React, Python, Figma, ..."
                            value={skills}
                            onChange={e => setSkills(e.target.value)}
                            required
                        />

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Post Requirement
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
