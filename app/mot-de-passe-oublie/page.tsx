'use client';

import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Interface seule : envoi simulé. Message neutre délibéré.
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Saisissez votre email pour recevoir un lien de réinitialisation."
    >
      {sent ? (
        <div className="flex animate-scale-in flex-col items-center gap-3 py-6 text-center">
          <MailCheck className="h-10 w-10 text-accent" />
          <p className="text-sm text-foreground/80">
            Si un compte existe avec cet email, un lien de réinitialisation a
            été envoyé.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5 animate-fade-up">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-visible:ring-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
