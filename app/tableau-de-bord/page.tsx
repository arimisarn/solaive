'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, PenLine, Users, StickyNote, Loader2, LayoutGrid } from 'lucide-react';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { createClient } from '@/lib/supabase/clients';
import { toast } from 'sonner';

const ACTIONS = [
  { icon: Users, label: 'Inviter un collaborateur' },
  { icon: StickyNote, label: 'Ouvrir un brouillon' },
];

type Tableau = {
  id: string;
  created_at: string | null;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TableauDeBordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [creating, setCreating] = useState(false);
  const [tableaux, setTableaux] = useState<Tableau[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    async function loadTableaux() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/connexion');
        return;
      }

      const { data, error } = await supabase
        .from('tableaux')
        .select('id, created_at')
        .eq('owner_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Impossible de charger tes tableaux.');
      } else {
        setTableaux(data ?? []);
      }
      setLoadingList(false);
    }

    loadTableaux();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/connexion');
    router.refresh();
  }

  async function handleNewBoard() {
    setCreating(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setCreating(false);
      router.push('/connexion');
      return;
    }

    const { data, error } = await supabase
      .from('tableaux')
      .insert({ owner_id: userData.user.id })
      .select('id')
      .single();

    setCreating(false);

    if (error || !data) {
      toast.error("Impossible de créer le tableau. Réessaie.");
      return;
    }

    router.push(`/tableau/${data.id}`);
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
          <button
            type="button"
            onClick={handleNewBoard}
            disabled={creating}
            className="flex animate-fade-up items-center gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm disabled:opacity-60"
            style={{ animationDelay: '0.1s' }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <PenLine className="h-5 w-5" />}
            </span>
            <span className="text-sm font-medium text-foreground">
              {creating ? 'Création…' : 'Nouveau tableau'}
            </span>
          </button>

          {ACTIONS.map((action, i) => (
            <button
              key={action.label}
              type="button"
              disabled
              className="flex animate-fade-up items-center gap-3 rounded-xl border border-border bg-card p-5 text-left opacity-50 cursor-not-allowed"
              style={{ animationDelay: `${0.18 + i * 0.08}s` }}
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

        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Tes tableaux
          </h2>

          {loadingList ? (
            <div className="mt-6 flex items-center gap-2 text-foreground/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : tableaux.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <LayoutGrid className="h-6 w-6 text-foreground/40" />
              <p className="text-sm text-foreground/60">
                Tu n'as pas encore de tableau. Crée le premier ci-dessus.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tableaux.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/tableau/${t.id}`}
                  className="flex animate-fade-up flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <PenLine className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    Tableau du {formatDate(t.created_at)}
                  </span>
                  <span className="text-xs text-foreground/50">
                    {t.id.slice(0, 8)}…
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}