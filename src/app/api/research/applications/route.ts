import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type UpdateStatusBody = {
    applicationId: string
    status: 'accepted' | 'rejected'
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const mode = request.nextUrl.searchParams.get('mode') || 'lead'

        if (mode === 'mine') {
            const { data, error } = await supabase
                .from('research_applications')
                .select('*, research_posts(id, title, research_domain, publication_target, deadline, created_by)')
                .eq('applicant_id', user.id)
                .order('created_at', { ascending: false })

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ applications: data || [] })
        }

        const { data: myPosts, error: postError } = await supabase
            .from('research_posts')
            .select('id')
            .eq('created_by', user.id)

        if (postError) {
            return NextResponse.json({ error: postError.message }, { status: 500 })
        }

        const postIds = (myPosts || []).map(post => post.id)
        if (postIds.length === 0) {
            return NextResponse.json({ applications: [] })
        }

        const { data: apps, error } = await supabase
            .from('research_applications')
            .select('id, motivation, research_experience, status, created_at, research_post_id, applicant_id')
            .in('research_post_id', postIds)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const applicantIds = Array.from(new Set((apps || []).map(app => app.applicant_id)))

        const [profileRows, researchProfileRows, publicationRows, accountRows] = await Promise.all([
            supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, resume_url, email')
                .in('id', applicantIds),
            supabase
                .from('research_profile')
                .select('user_id, research_interests, research_experience_level, research_tools')
                .in('user_id', applicantIds),
            supabase
                .from('research_publications')
                .select('id, user_id, title, journal_or_conference, year, doi_link, github_repo, role')
                .in('user_id', applicantIds)
                .order('year', { ascending: false }),
            supabase
                .from('linked_accounts')
                .select('user_id, platform, platform_username')
                .in('user_id', applicantIds),
        ])

        if (profileRows.error || researchProfileRows.error || publicationRows.error || accountRows.error) {
            return NextResponse.json({
                error: profileRows.error?.message || researchProfileRows.error?.message || publicationRows.error?.message || accountRows.error?.message || 'Failed to fetch applicant details',
            }, { status: 500 })
        }

        const profileMap = new Map((profileRows.data || []).map(row => [row.id, row]))
        const researchProfileMap = new Map((researchProfileRows.data || []).map(row => [row.user_id, row]))
        const publicationsMap = new Map<string, typeof publicationRows.data>()
        ;(publicationRows.data || []).forEach(row => {
            const list = publicationsMap.get(row.user_id) || []
            list.push(row)
            publicationsMap.set(row.user_id, list)
        })
        const accountsMap = new Map<string, typeof accountRows.data>()
        ;(accountRows.data || []).forEach(row => {
            const list = accountsMap.get(row.user_id) || []
            list.push(row)
            accountsMap.set(row.user_id, list)
        })

        const enriched = (apps || []).map(app => {
            const applicantProfile = profileMap.get(app.applicant_id)
            const applicantResearchProfile = researchProfileMap.get(app.applicant_id)
            const applicantPublications = publicationsMap.get(app.applicant_id) || []
            const applicantAccounts = accountsMap.get(app.applicant_id) || []
            return {
                ...app,
                applicant: {
                    ...applicantProfile,
                    research_profile: applicantResearchProfile || null,
                    publications: applicantPublications,
                    linked_accounts: applicantAccounts,
                },
            }
        })

        return NextResponse.json({ applications: enriched })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch research applications'
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

        const body = (await request.json()) as UpdateStatusBody
        if (!body.applicationId || !['accepted', 'rejected'].includes(body.status)) {
            return NextResponse.json({ error: 'Valid applicationId and status are required' }, { status: 400 })
        }

        const { data: application, error: appError } = await supabase
            .from('research_applications')
            .select('id, applicant_id, research_post_id')
            .eq('id', body.applicationId)
            .single()

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const { data: post, error: postError } = await supabase
            .from('research_posts')
            .select('id, title, created_by')
            .eq('id', application.research_post_id)
            .single()

        if (postError || !post) {
            return NextResponse.json({ error: 'Research post not found' }, { status: 404 })
        }

        if (post.created_by !== user.id) {
            return NextResponse.json({ error: 'Only research lead can update this application' }, { status: 403 })
        }

        const { error: updateError } = await supabase
            .from('research_applications')
            .update({ status: body.status })
            .eq('id', body.applicationId)

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        const { data: leadProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        await supabase
            .from('notifications')
            .insert({
                user_id: application.applicant_id,
                type: 'research_application_update',
                title: body.status === 'accepted' ? 'Research Application Accepted' : 'Research Application Update',
                message: body.status === 'accepted'
                    ? 'You were accepted to the research project.'
                    : 'You were rejected for the research project.',
                post_title: post.title,
                team_lead_email: user.email || '',
                team_lead_name: leadProfile?.full_name || 'Research Lead',
                is_read: false,
            })

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update application status'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
