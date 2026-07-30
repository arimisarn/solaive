'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/clients';

export default function ConnexionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect.'
          : 'Une erreur est survenue. Réessaie.'
      );
      return;
    }

    router.push('/tableau-de-bord');
    router.refresh();
  }

  return (
    <AuthCard
      title="Bienvenue sur Solaive"
      subtitle="Content de vous revoir. Connectez-vous pour continuer."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="font-medium text-accent hover:underline">
            S'inscrire
          </Link>
        </>
      }
    >
      <GoogleButton redirectTo="/tableau-de-bord" />

      <div className="my-6 flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
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

        <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs font-medium text-accent hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 focus-visible:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/50 hover:text-accent"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p
            aria-live="polite"
            className="animate-fade-in rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthCard>
  );
}