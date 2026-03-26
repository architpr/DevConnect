import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('research_posts')
            .select('*, profiles!research_posts_created_by_fkey(id, full_name, username, avatar_url, resume_url)')
            .eq('id', id)
            .single()

        if (error) {
            const isNotFound = error.code === 'PGRST116'
            return NextResponse.json(
                { error: isNotFound ? 'Research post not found' : error.message },
                { status: isNotFound ? 404 : 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch research post'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
