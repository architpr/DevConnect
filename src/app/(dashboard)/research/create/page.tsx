"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft } from 'lucide-react'

export default function CreateResearchPostPage() {
    const router = useRouter()

    const [title, setTitle] = useState('')
    const [researchDomain, setResearchDomain] = useState('')
    const [description, setDescription] = useState('')
    const [requiredSkills, setRequiredSkills] = useState('')
    const [requiredTools, setRequiredTools] = useState('')
    const [paperType, setPaperType] = useState<'survey' | 'experimental' | 'theoretical'>('survey')
    const [publicationTarget, setPublicationTarget] = useState('')
    const [publicationExperienceRequired, setPublicationExperienceRequired] = useState(false)
    const [teamSize, setTeamSize] = useState(3)
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await fetch('/api/research/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    researchDomain,
                    requiredSkills: requiredSkills.split(',').map(v => v.trim()).filter(Boolean),
                    requiredTools: requiredTools.split(',').map(v => v.trim()).filter(Boolean),
                    paperType,
                    publicationTarget,
                    publicationExperienceRequired,
                    teamSize,
                    deadline: deadline || null,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to create research post')
            }

            router.push(`/research/${data.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create research post')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-white" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to ResearchHub
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Create Research Collaboration Post
                    </CardTitle>
                    <CardDescription>
                        Define your project scope, research domain, and required collaboration profile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="LLM Benchmarking for Education" required />
                        <Input label="Research Domain" value={researchDomain} onChange={(e) => setResearchDomain(e.target.value)} placeholder="NLP, Computer Vision, HCI..." required />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Description</label>
                            <textarea
                                className="flex min-h-[140px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe objective, methodology, expected deliverables, and collaboration style..."
                                required
                            />
                        </div>
                        <Input label="Required Skills (comma-separated)" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="Python, Statistics, Research Writing" required />
                        <Input label="Required Tools (comma-separated)" value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} placeholder="LaTeX, Zotero, PyTorch" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Paper Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                    value={paperType}
                                    onChange={(e) => setPaperType(e.target.value as 'survey' | 'experimental' | 'theoretical')}
                                >
                                    <option value="survey">Survey</option>
                                    <option value="experimental">Experimental</option>
                                    <option value="theoretical">Theoretical</option>
                                </select>
                            </div>

                            <Input
                                type="number"
                                min={1}
                                max={20}
                                label="Team Size"
                                value={teamSize}
                                onChange={(e) => setTeamSize(Number(e.target.value))}
                                required
                            />
                        </div>

                        <Input label="Publication Target" value={publicationTarget} onChange={(e) => setPublicationTarget(e.target.value)} placeholder="IEEE Access, Springer, arXiv" />
                        <Input type="date" label="Deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

                        <label className="flex items-center gap-3 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={publicationExperienceRequired}
                                onChange={(e) => setPublicationExperienceRequired(e.target.checked)}
                                className="h-4 w-4 rounded border-white/20 bg-white/10"
                            />
                            Publication experience preferred
                        </label>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Publish Research Opportunity
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
