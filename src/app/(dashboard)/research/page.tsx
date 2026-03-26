"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Microscope, Plus, Sparkles, SlidersHorizontal, Lightbulb, BarChart3, Clock3 } from 'lucide-react'
import { ResearchPostCard } from '@/components/research/ResearchPostCard'

type ResearchPost = {
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

export default function ResearchFeedPage() {
    const [loading, setLoading] = useState(true)
    const [posts, setPosts] = useState<ResearchPost[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [domain, setDomain] = useState('')
    const [skills, setSkills] = useState('')
    const [tools, setTools] = useState('')
    const [paperType, setPaperType] = useState('')
    const [publicationTarget, setPublicationTarget] = useState('')
    const [publicationExperience, setPublicationExperience] = useState(false)

    const paperTypes = ['survey', 'experimental', 'theoretical'] as const
    const trendingDomains = ['Machine Learning', 'Cybersecurity', 'Distributed Systems', 'Bioinformatics', 'HCI', 'Vision']

    const activeFiltersCount = useMemo(() => {
        return [
            domain.trim(),
            skills.trim(),
            tools.trim(),
            paperType,
            publicationTarget.trim(),
            publicationExperience ? 'true' : '',
        ].filter(Boolean).length
    }, [domain, skills, tools, paperType, publicationTarget, publicationExperience])

    const clearFilters = () => {
        setPage(1)
        setDomain('')
        setSkills('')
        setTools('')
        setPaperType('')
        setPublicationTarget('')
        setPublicationExperience(false)
    }

    const query = useMemo(() => {
        const params = new URLSearchParams({
            page: String(page),
            pageSize: '9',
        })

        if (domain.trim()) params.set('domain', domain.trim())
        if (skills.trim()) params.set('skills', skills.trim())
        if (tools.trim()) params.set('tools', tools.trim())
        if (paperType) params.set('paperType', paperType)
        if (publicationTarget.trim()) params.set('publicationTarget', publicationTarget.trim())
        if (publicationExperience) params.set('publicationExperience', 'true')

        return params.toString()
    }, [page, domain, skills, tools, paperType, publicationTarget, publicationExperience])

    useEffect(() => {
        const run = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/research/posts?${query}`)
                const data = await res.json()
                if (res.ok) {
                    setPosts(data.posts || [])
                    setTotalPages(data.pagination?.totalPages || 1)
                } else {
                    setPosts([])
                }
            } catch {
                setPosts([])
            } finally {
                setLoading(false)
            }
        }

        run()
    }, [query])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-700 dark:from-yellow-300 dark:to-yellow-500 flex items-center gap-2">
                        <Microscope className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
                        ResearchHub
                    </h1>
                    <p className="text-muted-foreground mt-2">Find collaborators for papers, experiments, and research studies.</p>
                </div>
                <Link href="/research/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Research Post
                    </Button>
                </Link>
            </div>

            <div className="rounded-2xl border border-yellow-500/25 bg-white/85 dark:bg-zinc-950/80 p-5 md:p-6 shadow-lg shadow-black/10 dark:shadow-black/30 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <SlidersHorizontal className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="rounded-full bg-yellow-400/20 border border-yellow-500/40 px-2 py-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                                {activeFiltersCount} active
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="h-9 border-yellow-500/40 text-zinc-800 dark:text-zinc-100 hover:bg-yellow-400/10" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => { setPage(1); setPublicationExperience((prev) => !prev) }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${publicationExperience
                            ? 'bg-yellow-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
                            : 'bg-transparent border-black/15 dark:border-white/20 text-zinc-600 dark:text-zinc-300 hover:bg-yellow-400/10'
                            }`}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Publication Experience Preferred
                    </button>

                    {paperTypes.map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => { setPage(1); setPaperType((prev) => prev === type ? '' : type) }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${paperType === type
                                ? 'bg-yellow-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-300'
                                : 'border-black/15 dark:border-white/20 text-zinc-600 dark:text-zinc-300 hover:bg-yellow-400/10'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input
                        label="Research Domain"
                        placeholder="NLP, Systems, Security..."
                        value={domain}
                        onChange={(e) => { setPage(1); setDomain(e.target.value) }}
                        className="border-black/15 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-yellow-500"
                    />
                    <Input
                        label="Required Skills (comma-separated)"
                        placeholder="Python, PyTorch"
                        value={skills}
                        onChange={(e) => { setPage(1); setSkills(e.target.value) }}
                        className="border-black/15 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-yellow-500"
                    />
                    <Input
                        label="Tools (comma-separated)"
                        placeholder="LaTeX, Zotero"
                        value={tools}
                        onChange={(e) => { setPage(1); setTools(e.target.value) }}
                        className="border-black/15 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-yellow-500"
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Paper Type</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-black/15 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-zinc-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                            value={paperType}
                            onChange={(e) => { setPage(1); setPaperType(e.target.value) }}
                        >
                            <option value="">All</option>
                            <option value="survey">Survey</option>
                            <option value="experimental">Experimental</option>
                            <option value="theoretical">Theoretical</option>
                        </select>
                    </div>
                    <Input
                        label="Publication Target"
                        placeholder="IEEE, Springer, arXiv"
                        value={publicationTarget}
                        onChange={(e) => { setPage(1); setPublicationTarget(e.target.value) }}
                        className="border-black/15 dark:border-white/10 bg-white dark:bg-white/5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-yellow-500"
                    />
                    <div className="rounded-md border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3 flex items-center justify-between mt-7 md:mt-0">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Creator has publication experience</span>
                        <button
                            type="button"
                            onClick={() => { setPage(1); setPublicationExperience((prev) => !prev) }}
                            className={`h-6 w-11 rounded-full border transition-colors p-0.5 ${publicationExperience
                                ? 'bg-yellow-400/50 border-yellow-500/50'
                                : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
                                }`}
                            aria-label="Toggle publication experience filter"
                        >
                            <span className={`block h-4.5 w-4.5 rounded-full bg-white dark:bg-zinc-100 transition-transform ${publicationExperience ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-yellow-500/20 bg-white/85 dark:bg-zinc-950/80 p-5 shadow-md shadow-black/10 dark:shadow-black/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        Trending Domains
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {trendingDomains.map((domainItem) => (
                            <span
                                key={domainItem}
                                className="px-2.5 py-1 rounded-full text-xs border border-yellow-500/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-300"
                            >
                                {domainItem}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-yellow-500/20 bg-white/85 dark:bg-zinc-950/80 p-5 shadow-md shadow-black/10 dark:shadow-black/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        <BarChart3 className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        Weekly Activity Snapshot
                    </div>
                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                                <span>New Research Ideas</span>
                                <span>68%</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full w-[68%] bg-yellow-500/80" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                                <span>Active Collaborators</span>
                                <span>44%</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full w-[44%] bg-yellow-500/80" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                                <span>Draft to Submission</span>
                                <span>27%</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div className="h-full w-[27%] bg-yellow-500/80" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-yellow-500/20 bg-white/85 dark:bg-zinc-950/80 p-5 shadow-md shadow-black/10 dark:shadow-black/30">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        <Clock3 className="h-4 w-4 text-yellow-600 dark:text-yellow-300" />
                        Upcoming Milestones
                    </div>
                    <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3">
                            <p className="font-medium text-zinc-800 dark:text-zinc-100">Literature Review Sprint</p>
                            <p className="text-xs text-muted-foreground mt-1">Mock UI element · 2 days left</p>
                        </div>
                        <div className="rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3">
                            <p className="font-medium text-zinc-800 dark:text-zinc-100">Experiment Planning Sync</p>
                            <p className="text-xs text-muted-foreground mt-1">Mock UI element · 5 days left</p>
                        </div>
                        <div className="rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3">
                            <p className="font-medium text-zinc-800 dark:text-zinc-100">Submission Checklist</p>
                            <p className="text-xs text-muted-foreground mt-1">Mock UI element · 9 days left</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No research posts found for the selected filters.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map(post => (
                            <ResearchPostCard key={post.id} post={post} />
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {page} of {Math.max(totalPages, 1)}</span>
                        <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
