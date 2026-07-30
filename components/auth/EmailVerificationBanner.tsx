'use client';

import { useEffect, useState } from 'react';
import { MailWarning, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';

export function EmailVerificationBanner() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [verified, setVerified] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);

      // On lit profiles.email_verified_at, pas user.email_confirmed_at :
      // ce dernier n'est plus fiable depuis que "Confirm email" est
      // désactivé côté Supabase (voir passation, section 3).
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified_at')
        .eq('id', user.id)
        .maybeSingle();

      setVerified(!!profile?.email_verified_at);
      setLoading(false);
    }

    checkStatus();
  }, [supabase]);

  async function handleResend() {
    if (!email) return;
    setResending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });

    setResending(false);

    if (error) {
      toast.error("Impossible de renvoyer l'email. Réessaie dans quelques instants.");
    } else {
      toast.success('Un nouvel email de vérification a été envoyé.');
    }
  }

  if (loading || dismissed || verified) return null;

  return (
    <div className="flex animate-fade-down items-center gap-3 border-b border-accent/15 bg-accent/5 px-4 py-2.5 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="hidden text-foreground/80 sm:inline">
        Vérifiez votre email pour sécuriser votre compte
      </span>
      <span className="text-foreground/80 sm:hidden">Vérifiez votre email</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {resending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {resending ? 'Envoi…' : "Renvoyer l'email"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Masquer le bandeau"
          className="ml-1 rounded-md p-1 text-foreground/50 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
