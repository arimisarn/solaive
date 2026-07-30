'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = {
  email?: string;
  password?: string;
  confirm?: string;
};

function validatePassword(pw: string): string | undefined {
  if (pw.length < 8) return 'Au moins 8 caractères';
  if (!/[A-Z]/.test(pw)) return 'Doit contenir une majuscule';
  if (!/\d/.test(pw)) return 'Doit contenir un chiffre';
  return undefined;
}

export default function InscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  function handleEmail(value: string) {
    setEmail(value);
    setErrors((e) => ({ ...e, email: value && !EMAIL_RE.test(value) ? 'Adresse email invalide' : undefined }));
  }

  function handlePassword(value: string) {
    setPassword(value);
    setErrors((e) => ({
      ...e,
      password: validatePassword(value),
      confirm: confirm && value !== confirm ? 'Les mots de passe ne correspondent pas' : e.confirm,
    }));
  }

  function handleConfirm(value: string) {
    setConfirm(value);
    setErrors((e) => ({ ...e, confirm: value !== password ? 'Les mots de passe ne correspondent pas' : undefined }));
  }

  const isFormValid =
    EMAIL_RE.test(email) &&
    !validatePassword(password) &&
    password === confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    // Interface seule : redirection simulée après un court délai.
    setTimeout(() => {
      toast.success('Bienvenue sur Solaive !');
      router.push('/tableau-de-bord');
    }, 900);
  }

  return (
    <AuthCard
      title="Créez votre compte"
      subtitle="Gratuit, sans carte bancaire, en quelques secondes."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link href="/connexion" className="font-medium text-accent hover:underline">
            Se connecter
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
            onChange={(e) => handleEmail(e.target.value)}
            className="focus-visible:ring-accent"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" aria-live="polite" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePassword(e.target.value)}
              className="pr-10 focus-visible:ring-accent"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
          {errors.password && (
            <p id="password-error" aria-live="polite" className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <Input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => handleConfirm(e.target.value)}
            className="focus-visible:ring-accent"
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? 'confirm-error' : undefined}
          />
          {errors.confirm && (
            <p id="confirm-error" aria-live="polite" className="text-xs text-destructive">
              {errors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Création…' : "S'inscrire"}
        </button>
      </form>
    </AuthCard>
  );
}
