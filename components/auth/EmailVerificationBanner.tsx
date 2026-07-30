'use client';

import { useState } from 'react';
import { MailWarning, X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function EmailVerificationBanner() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [verified, setVerified] = useState(false);

  if (dismissed || verified) return null;

  // Interface seule : vérification simulée.
  function handleVerify() {
    if (code.trim().length !== 6) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      toast.success('Code vérifié avec succès');
    }, 800);
  }

  function handleResend() {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      toast.success('Un nouveau code a été envoyé par email');
    }, 800);
  }

  return (
    <div className="flex animate-fade-down items-center gap-3 border-b border-accent/15 bg-accent/5 px-4 py-2.5 text-sm">
      <MailWarning className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="hidden text-foreground/80 sm:inline">
        Vérifiez votre email pour sécuriser votre compte
      </span>
      <span className="text-foreground/80 sm:hidden">Vérifiez votre email</span>

      <div className="ml-auto flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Code à 6 chiffres"
          aria-label="Code de vérification à 6 chiffres"
          className="h-8 w-32 rounded-md border border-accent/20 bg-card px-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || code.trim().length !== 6}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Valider
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-xs font-medium text-accent/80 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {resending ? 'Envoi…' : 'Renvoyer le code'}
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
