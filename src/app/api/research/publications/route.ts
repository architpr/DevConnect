import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PublicationBody = {
    id?: string
    userId?: string
    title?: string
    journalOrConference?: string
    year?: number
    doiLink?: string
    githubRepo?: string
    role?: 'author' | 'co-author'
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const userId = request.nextUrl.searchParams.get('userId')

        let query = supabase
            .from('research_publications')
            .select('*')
            .order('year', { ascending: false })

        if (userId) query = query.eq('user_id', userId)

        const { data, error } = await query
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ publications: data || [] }, {
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300',
            },
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch publications'
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

        const body = (await request.json()) as PublicationBody
        if (!body.title?.trim() || !body.journalOrConference?.trim() || !body.year) {
            return NextResponse.json({ error: 'Title, journal/conference, and year are required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('research_publications')
            .insert({
                user_id: user.id,
                title: body.title.trim(),
                journal_or_conference: body.journalOrConference.trim(),
                year: body.year,
                doi_link: body.doiLink?.trim() || null,
                github_repo: body.githubRepo?.trim() || null,
                role: body.role || 'author',
            })
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ publication: data }, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create publication'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = (await request.json()) as PublicationBody
        if (!body.id) {
            return NextResponse.json({ error: 'Publication id is required' }, { status: 400 })
        }

        const updatePayload: {
            title?: string
            journal_or_conference?: string
            year?: number
            doi_link?: string | null
            github_repo?: string | null
            role?: 'author' | 'co-author'
        } = {}

        if (body.title !== undefined) updatePayload.title = body.title.trim()
        if (body.journalOrConference !== undefined) updatePayload.journal_or_conference = body.journalOrConference.trim()
        if (body.year !== undefined) updatePayload.year = body.year
        if (body.doiLink !== undefined) updatePayload.doi_link = body.doiLink.trim() || null
        if (body.githubRepo !== undefined) updatePayload.github_repo = body.githubRepo.trim() || null
        if (body.role !== undefined) updatePayload.role = body.role

        const { data, error } = await supabase
            .from('research_publications')
            .update(updatePayload)
            .eq('id', body.id)
            .eq('user_id', user.id)
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ publication: data })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update publication'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = request.nextUrl.searchParams.get('id')
        if (!id) {
            return NextResponse.json({ error: 'Publication id is required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('research_publications')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete publication'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
