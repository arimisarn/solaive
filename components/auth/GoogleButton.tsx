'use client';

import { useState } from 'react';
import { GoogleIcon } from './GoogleIcon';
import { createClient } from '@/lib/supabase/clients';

export function GoogleButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleGoogle() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo ?? '/tableau-de-bord'}`,
      },
    });

    if (error) {
      setLoading(false);
      console.error('Erreur de connexion Google :', error.message);
    }
    // Pas de redirection manuelle ici : Supabase redirige automatiquement
    // vers Google, puis revient sur /auth/callback.
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? 'Connexion…' : 'Continuer avec Google'}
    </button>
  );
}