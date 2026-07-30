'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, PenLine, Users, StickyNote } from 'lucide-react';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { createClient } from '@/lib/supabase/clients';

const ACTIONS = [
  { icon: PenLine, label: 'Nouveau tableau', href: '#' },
  { icon: Users, label: 'Inviter un collaborateur', href: '#' },
  { icon: StickyNote, label: 'Ouvrir un brouillon', href: '#' },
];

export default function TableauDeBordPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/connexion');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <EmailVerificationBanner />
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-heading text-xl font-bold text-accent">
            Solaive
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:text-accent"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-fade-up">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Vos tableaux
          </h1>
          <p className="mt-2 text-foreground/60">
            Choisissez une action pour démarrer.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {ACTIONS.map((action, i) => (
            <button
              key={action.label}
              type="button"
              className="flex animate-fade-up items-center gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <action.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}