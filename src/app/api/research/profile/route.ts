import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ResearchProfileBody = {
    userId?: string
    researchInterests?: string[]
    researchExperienceLevel?: string
    researchTools?: string[]
    researchAvailability?: string
    googleScholar?: string
    orcid?: string
    researchGate?: string
    arxiv?: string
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const userId = request.nextUrl.searchParams.get('userId')

        if (!userId) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const { data, error } = await supabase
                .from('research_profile')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ profile: data || null })
        }

        const { data, error } = await supabase
            .from('research_profile')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data || null }, {
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch research profile'
        return NextResponse.json({ error: message }, { status: 500 })
    }
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

        const body = (await request.json()) as ResearchProfileBody

        const payload = {
            user_id: user.id,
            research_interests: body.researchInterests || [],
            research_experience_level: body.researchExperienceLevel || 'beginner',
            research_tools: body.researchTools || [],
            research_availability: body.researchAvailability || 'part-time',
            google_scholar: body.googleScholar?.trim() || null,
            orcid: body.orcid?.trim() || null,
            researchgate: body.researchGate?.trim() || null,
            arxiv: body.arxiv?.trim() || null,
        }

        const { data, error } = await supabase
            .from('research_profile')
            .upsert(payload, { onConflict: 'user_id' })
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile: data })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upsert research profile'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
