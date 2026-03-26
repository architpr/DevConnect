import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CreateResearchPostBody = {
    title: string
    description: string
    researchDomain: string
    requiredSkills: string[]
    requiredTools?: string[]
    paperType: 'survey' | 'experimental' | 'theoretical'
    publicationTarget?: string
    publicationExperienceRequired?: boolean
    teamSize: number
    deadline?: string
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as CreateResearchPostBody

        if (!body.title?.trim() || !body.description?.trim() || !body.researchDomain?.trim()) {
            return NextResponse.json({ error: 'Title, description, and research domain are required' }, { status: 400 })
        }

        if (!['survey', 'experimental', 'theoretical'].includes(body.paperType)) {
            return NextResponse.json({ error: 'Invalid paper type' }, { status: 400 })
        }

        const teamSize = Math.max(1, Math.min(20, Number(body.teamSize || 1)))

        const { data, error } = await supabase
            .from('research_posts')
            .insert({
                title: body.title.trim(),
                description: body.description.trim(),
                research_domain: body.researchDomain.trim(),
                required_skills: body.requiredSkills || [],
                required_tools: body.requiredTools || [],
                paper_type: body.paperType,
                publication_target: body.publicationTarget?.trim() || null,
                publication_experience_required: !!body.publicationExperienceRequired,
                team_size: teamSize,
                deadline: body.deadline || null,
                created_by: user.id,
                status: 'open',
            })
            .select('id')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ id: data.id }, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create research post'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
