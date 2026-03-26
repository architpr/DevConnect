"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Microscope, Plus, Save, Trash2, Pencil } from 'lucide-react'

type ResearchProfile = {
    user_id?: string
    research_interests: string[]
    research_experience_level: string
    research_tools: string[]
    research_availability: string
    google_scholar: string | null
    orcid: string | null
    researchgate: string | null
    arxiv: string | null
}

type Publication = {
    id: string
    title: string
    journal_or_conference: string
    year: number
    doi_link: string | null
    github_repo: string | null
    role: 'author' | 'co-author'
}

const initialResearchProfile: ResearchProfile = {
    research_interests: [],
    research_experience_level: 'beginner',
    research_tools: [],
    research_availability: 'part-time',
    google_scholar: null,
    orcid: null,
    researchgate: null,
    arxiv: null,
}

type PublicationForm = {
    id?: string
    title: string
    journalOrConference: string
    year: string
    doiLink: string
    githubRepo: string
    role: 'author' | 'co-author'
}

const initialPublicationForm: PublicationForm = {
    title: '',
    journalOrConference: '',
    year: String(new Date().getFullYear()),
    doiLink: '',
    githubRepo: '',
    role: 'author',
}

export function ResearchProfileSection({ userId }: { userId: string | null | undefined }) {
    const [loading, setLoading] = useState(true)
    const [savingProfile, setSavingProfile] = useState(false)
    const [savingPublication, setSavingPublication] = useState(false)

    const [researchProfile, setResearchProfile] = useState<ResearchProfile>(initialResearchProfile)
    const [interestsText, setInterestsText] = useState('')
    const [toolsText, setToolsText] = useState('')

    const [publications, setPublications] = useState<Publication[]>([])
    const [publicationForm, setPublicationForm] = useState<PublicationForm>(initialPublicationForm)

    const isEditing = useMemo(() => Boolean(publicationForm.id), [publicationForm.id])

    useEffect(() => {
        const loadResearchData = async () => {
            if (!userId) return
            setLoading(true)
            try {
                const [profileRes, publicationsRes] = await Promise.all([
                    fetch('/api/research/profile'),
                    fetch(`/api/research/publications?userId=${userId}`),
                ])

                const [profileData, publicationsData] = await Promise.all([
                    profileRes.json(),
                    publicationsRes.json(),
                ])

                if (profileRes.ok && profileData.profile) {
                    setResearchProfile(profileData.profile)
                    setInterestsText((profileData.profile.research_interests || []).join(', '))
                    setToolsText((profileData.profile.research_tools || []).join(', '))
                }

                if (publicationsRes.ok) {
                    setPublications(publicationsData.publications || [])
                }
            } catch {
                // Keep default state
            } finally {
                setLoading(false)
            }
        }

        loadResearchData()
    }, [userId])

    const saveResearchProfile = async () => {
        setSavingProfile(true)
        try {
            const res = await fetch('/api/research/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    researchInterests: interestsText.split(',').map(v => v.trim()).filter(Boolean),
                    researchExperienceLevel: researchProfile.research_experience_level,
                    researchTools: toolsText.split(',').map(v => v.trim()).filter(Boolean),
                    researchAvailability: researchProfile.research_availability,
                    googleScholar: researchProfile.google_scholar,
                    orcid: researchProfile.orcid,
                    researchGate: researchProfile.researchgate,
                    arxiv: researchProfile.arxiv,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to save research profile')

            setResearchProfile(data.profile)
            setInterestsText((data.profile.research_interests || []).join(', '))
            setToolsText((data.profile.research_tools || []).join(', '))
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save research profile')
        } finally {
            setSavingProfile(false)
        }
    }

    const resetPublicationForm = () => {
        setPublicationForm(initialPublicationForm)
    }

    const savePublication = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingPublication(true)

        try {
            const endpoint = '/api/research/publications'
            const method = isEditing ? 'PATCH' : 'POST'
            const payload = {
                id: publicationForm.id,
                title: publicationForm.title,
                journalOrConference: publicationForm.journalOrConference,
                year: Number(publicationForm.year),
                doiLink: publicationForm.doiLink,
                githubRepo: publicationForm.githubRepo,
                role: publicationForm.role,
            }

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to save publication')

            if (isEditing) {
                setPublications(prev => prev.map(pub => pub.id === data.publication.id ? data.publication : pub))
            } else {
                setPublications(prev => [data.publication, ...prev])
            }

            resetPublicationForm()
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save publication')
        } finally {
            setSavingPublication(false)
        }
    }

    const editPublication = (publication: Publication) => {
        setPublicationForm({
            id: publication.id,
            title: publication.title,
            journalOrConference: publication.journal_or_conference,
            year: String(publication.year),
            doiLink: publication.doi_link || '',
            githubRepo: publication.github_repo || '',
            role: publication.role,
        })
    }

    const deletePublication = async (id: string) => {
        const confirmDelete = window.confirm('Delete this publication?')
        if (!confirmDelete) return

        try {
            const res = await fetch(`/api/research/publications?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || 'Failed to delete publication')
            setPublications(prev => prev.filter(pub => pub.id !== id))
            if (publicationForm.id === id) resetPublicationForm()
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete publication')
        }
    }

    if (loading) {
        return (
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <CardContent className="p-6 text-gray-400">Loading research profile...</CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Microscope className="h-5 w-5 text-cyan-400" />
                        Research Profile
                    </CardTitle>
                    <CardDescription>Manage your research interests, tools, and academic links.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        label="Research Interests (comma-separated)"
                        value={interestsText}
                        onChange={(e) => setInterestsText(e.target.value)}
                        placeholder="NLP, Systems, Human-Computer Interaction"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Experience Level</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                value={researchProfile.research_experience_level || 'beginner'}
                                onChange={(e) => setResearchProfile(prev => ({ ...prev, research_experience_level: e.target.value }))}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Availability</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                value={researchProfile.research_availability || 'part-time'}
                                onChange={(e) => setResearchProfile(prev => ({ ...prev, research_availability: e.target.value }))}
                            >
                                <option value="part-time">Part-time</option>
                                <option value="full-time">Full-time</option>
                                <option value="weekends">Weekends</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Research Tools (comma-separated)"
                        value={toolsText}
                        onChange={(e) => setToolsText(e.target.value)}
                        placeholder="LaTeX, Zotero, Overleaf, PyTorch"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Google Scholar" value={researchProfile.google_scholar || ''} onChange={(e) => setResearchProfile(prev => ({ ...prev, google_scholar: e.target.value }))} placeholder="https://scholar.google.com/..." />
                        <Input label="ORCID" value={researchProfile.orcid || ''} onChange={(e) => setResearchProfile(prev => ({ ...prev, orcid: e.target.value }))} placeholder="https://orcid.org/..." />
                        <Input label="ResearchGate" value={researchProfile.researchgate || ''} onChange={(e) => setResearchProfile(prev => ({ ...prev, researchgate: e.target.value }))} placeholder="https://www.researchgate.net/..." />
                        <Input label="arXiv" value={researchProfile.arxiv || ''} onChange={(e) => setResearchProfile(prev => ({ ...prev, arxiv: e.target.value }))} placeholder="https://arxiv.org/a/..." />
                    </div>

                    <Button className="gap-2" onClick={saveResearchProfile} isLoading={savingProfile}>
                        <Save className="h-4 w-4" />
                        Save Research Profile
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                    <CardTitle className="text-lg">Publications</CardTitle>
                    <CardDescription>Add, edit, and manage your research publication history.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form className="space-y-4" onSubmit={savePublication}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Title" value={publicationForm.title} onChange={(e) => setPublicationForm(prev => ({ ...prev, title: e.target.value }))} required />
                            <Input label="Journal / Conference" value={publicationForm.journalOrConference} onChange={(e) => setPublicationForm(prev => ({ ...prev, journalOrConference: e.target.value }))} required />
                            <Input type="number" label="Year" value={publicationForm.year} onChange={(e) => setPublicationForm(prev => ({ ...prev, year: e.target.value }))} required />
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Role</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                    value={publicationForm.role}
                                    onChange={(e) => setPublicationForm(prev => ({ ...prev, role: e.target.value as 'author' | 'co-author' }))}
                                >
                                    <option value="author">Author</option>
                                    <option value="co-author">Co-author</option>
                                </select>
                            </div>
                            <Input label="DOI Link" value={publicationForm.doiLink} onChange={(e) => setPublicationForm(prev => ({ ...prev, doiLink: e.target.value }))} placeholder="https://doi.org/..." />
                            <Input label="GitHub Repo" value={publicationForm.githubRepo} onChange={(e) => setPublicationForm(prev => ({ ...prev, githubRepo: e.target.value }))} placeholder="https://github.com/..." />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" isLoading={savingPublication} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {isEditing ? 'Update Publication' : 'Add Publication'}
                            </Button>
                            {isEditing && (
                                <Button type="button" variant="outline" onClick={resetPublicationForm}>
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                    </form>

                    {publications.length === 0 ? (
                        <p className="text-sm text-gray-500">No publications added yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {publications.map(pub => (
                                <div key={pub.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="font-medium text-gray-200">{pub.title}</div>
                                            <div className="text-sm text-gray-400">{pub.journal_or_conference} • {pub.year} • {pub.role}</div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                                {pub.doi_link && <a href={pub.doi_link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">DOI</a>}
                                                {pub.github_repo && <a href={pub.github_repo} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">GitHub</a>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="h-9 px-3" onClick={() => editPublication(pub)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" className="h-9 px-3 text-red-400 hover:text-red-300" onClick={() => deletePublication(pub.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
