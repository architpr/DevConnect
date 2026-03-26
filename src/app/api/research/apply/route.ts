import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ApplyBody = {
    researchPostId: string
    motivation: string
    researchExperience?: string
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

        const body = (await request.json()) as ApplyBody
        if (!body.researchPostId || !body.motivation?.trim()) {
            return NextResponse.json({ error: 'Research post and motivation are required' }, { status: 400 })
        }

        const { data: post, error: postError } = await supabase
            .from('research_posts')
            .select('id, created_by, status')
            .eq('id', body.researchPostId)
            .single()

        if (postError || !post) {
            return NextResponse.json({ error: 'Research post not found' }, { status: 404 })
        }

        if (post.status !== 'open') {
            return NextResponse.json({ error: 'Research post is closed' }, { status: 400 })
        }

        if (post.created_by === user.id) {
            return NextResponse.json({ error: 'You cannot apply to your own research post' }, { status: 400 })
        }

        const { error } = await supabase
            .from('research_applications')
            .insert({
                research_post_id: body.researchPostId,
                applicant_id: user.id,
                motivation: body.motivation.trim(),
                research_experience: body.researchExperience?.trim() || null,
                status: 'pending',
            })

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'You have already applied to this research project' }, { status: 409 })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to apply to research post'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
