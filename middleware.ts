import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_COOKIE_OPTIONS } from './lib/supabase/cookie-options';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookieOptions: SUPABASE_COOKIE_OPTIONS,
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Rafraîchit la session si besoin (obligatoire : ne jamais retirer cet appel,
    // c'est lui qui garde les cookies de session synchronisés).
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // const protectedPaths = ['/tableau-de-bord'];
    const protectedPaths = ['/tableau-de-bord', '/tableau'];
    const isProtected = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtected && !user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/connexion';
        return NextResponse.redirect(redirectUrl);
    }

    // Si l'utilisateur est déjà connecté, on ne lui montre plus la landing
    // page ni les pages de connexion/inscription : on l'envoie directement
    // vers son tableau de bord.
    const authPages = ['/', '/connexion', '/inscription'];
    const isAuthPage = authPages.includes(request.nextUrl.pathname);

    if (isAuthPage && user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/tableau-de-bord';
        return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};