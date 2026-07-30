'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleIcon } from './GoogleIcon';

export function GoogleButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleGoogle() {
    setLoading(true);
    // Interface seule : redirection simulée après un court délai.
    setTimeout(() => {
      router.push(redirectTo ?? '/tableau-de-bord');
    }, 900);
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
