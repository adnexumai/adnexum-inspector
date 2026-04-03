import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public routes — no auth required
    const publicRoutes = ['/login', '/auth', '/pending-approval']
    const isPublic = publicRoutes.some(r => pathname.startsWith(r))

    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in and NOT on a public route, check if approved
    if (user && !isPublic) {
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('approved')
            .eq('user_id', user.id)
            .single()

        // Not approved → redirect to pending page
        if (!userRole || !userRole.approved) {
            const url = request.nextUrl.clone()
            url.pathname = '/pending-approval'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
