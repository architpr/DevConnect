import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ResearchPost = {
    id: string
    title: string
    description: string
    research_domain: string
    required_skills: string[] | null
    paper_type: 'survey' | 'experimental' | 'theoretical'
    publication_target: string | null
    required_tools: string[] | null
    publication_experience_required: boolean | null
    team_size: number
    created_by: string
    deadline: string | null
    status: 'open' | 'closed'
    created_at: string
    profiles?: {
        full_name: string | null
        username: string | null
        avatar_url: string | null
    }
}

function parseCsv(value: string | null): string[] {
    if (!value) return []
    return value.split(',').map(v => v.trim()).filter(Boolean)
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const searchParams = request.nextUrl.searchParams

        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
        const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '12', 10), 1), 30)
        const domain = searchParams.get('domain')?.trim() || ''
        const paperType = searchParams.get('paperType')?.trim() || ''
        const publicationTarget = searchParams.get('publicationTarget')?.trim() || ''
        const includeClosed = searchParams.get('includeClosed') === 'true'
        const skillFilters = parseCsv(searchParams.get('skills'))
        const toolFilters = parseCsv(searchParams.get('tools'))
        const publicationExperience = searchParams.get('publicationExperience') === 'true'

        let query = supabase
            .from('research_posts')
            .select('*, profiles!research_posts_created_by_fkey(full_name, username, avatar_url)', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (domain) query = query.ilike('research_domain', `%${domain}%`)
        if (paperType) query = query.eq('paper_type', paperType)
        if (publicationTarget) query = query.ilike('publication_target', `%${publicationTarget}%`)
        if (!includeClosed) query = query.eq('status', 'open')

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await query.range(from, to)
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let posts: ResearchPost[] = (data as ResearchPost[] | null) || []

        if (skillFilters.length > 0) {
            posts = posts.filter(post => {
                const lowerSkills = (post.required_skills || []).map(s => s.toLowerCase())
                return skillFilters.every(filter => lowerSkills.some(s => s.includes(filter.toLowerCase())))
            })
        }

        if (toolFilters.length > 0 || publicationExperience) {
            const creatorIds = Array.from(new Set(posts.map(post => post.created_by)))

            const [profileRows, publicationRows] = await Promise.all([
                toolFilters.length > 0
                    ? supabase
                        .from('research_profile')
                        .select('user_id, research_tools')
                        .in('user_id', creatorIds)
                    : Promise.resolve({ data: [] as { user_id: string; research_tools: string[] | null }[], error: null }),
                publicationExperience
                    ? supabase
                        .from('research_publications')
                        .select('user_id')
                        .in('user_id', creatorIds)
                    : Promise.resolve({ data: [] as { user_id: string }[], error: null }),
            ])

            if (profileRows.error) {
                return NextResponse.json({ error: profileRows.error.message }, { status: 500 })
            }
            if (publicationRows.error) {
                return NextResponse.json({ error: publicationRows.error.message }, { status: 500 })
            }

            const toolsMap = new Map<string, string[]>((profileRows.data || []).map(row => [row.user_id, row.research_tools || []]))
            const publicationUserSet = new Set((publicationRows.data || []).map(row => row.user_id))

            posts = posts.filter(post => {
                const creatorTools = (toolsMap.get(post.created_by) || []).map(t => t.toLowerCase())
                const toolsOk = toolFilters.length === 0 || toolFilters.every(filter => creatorTools.some(tool => tool.includes(filter.toLowerCase())))
                const publicationOk = !publicationExperience || publicationUserSet.has(post.created_by)
                return toolsOk && publicationOk
            })
        }

        return NextResponse.json({
            posts,
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: count ? Math.ceil(count / pageSize) : 0,
            },
        }, {
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch research posts'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
