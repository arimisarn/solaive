import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/tableau-de-bord';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Un compte Google arrive avec un email déjà vérifié par Google :
      // pas besoin de lui faire passer le flux de vérification par email.
      if (data.user.app_metadata?.provider === 'google') {
        await supabase
          .from('profiles')
          .update({ email_verified_at: new Date().toISOString() })
          .eq('id', data.user.id)
          .is('email_verified_at', null);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`);
}