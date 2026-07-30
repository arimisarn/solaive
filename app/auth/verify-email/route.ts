import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/tableau-de-bord';

  console.log('[verify-email] code reçu :', code);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('[verify-email] exchangeCodeForSession — error:', error, 'user id:', data.user?.id);

    if (!error && data.user) {
      const { error: updateError, count } = await supabase
        .from('profiles')
        .update({ email_verified_at: new Date().toISOString() })
        .eq('id', data.user.id)
        .is('email_verified_at', null)
        .select();

      console.log('[verify-email] update profiles — error:', updateError, 'count:', count);

      return NextResponse.redirect(`${origin}${next}?verified=1`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=verification`);
}