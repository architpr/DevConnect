import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function syncProfileEmailIfMissing(
    supabase: ReturnType<typeof createServerClient>,
    userId: string,
    authEmail: string | null | undefined
) {
    const email = authEmail?.trim()
    if (!email) return

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', userId)
        .maybeSingle()

    if (profileError) return

    if (!profile) {
        await supabase.from('profiles').insert({ id: userId, email })
        return
    }

    if (!profile.email) {
        await supabase
            .from('profiles')
            .update({ email })
            .eq('id', userId)
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/profile'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await syncProfileEmailIfMissing(supabase, user.id, user.email)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
