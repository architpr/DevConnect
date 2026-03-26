"use client"

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function ApplyResearchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [motivation, setMotivation] = useState('')
    const [researchExperience, setResearchExperience] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch('/api/research/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    researchPostId: id,
                    motivation,
                    researchExperience,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to submit application')
            }

            router.push('/research')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit application')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href={`/research/${id}`}>
                <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Post
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Apply to Research Project
                    </CardTitle>
                    <CardDescription>
                        Explain your motivation and relevant research experience.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Motivation Statement</label>
                            <textarea
                                className="flex min-h-[140px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                value={motivation}
                                onChange={(e) => setMotivation(e.target.value)}
                                placeholder="Why do you want to contribute to this research project?"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Research Experience</label>
                            <textarea
                                className="flex min-h-[140px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                value={researchExperience}
                                onChange={(e) => setResearchExperience(e.target.value)}
                                placeholder="Mention prior publications, experiments, tools, or academic work."
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Submit Application
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
