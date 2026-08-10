'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Users, StickyNote, Loader2, LayoutGrid } from 'lucide-react';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { ShareDialog } from '@/components/ShareDialog';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import { AppSidebar } from '@/components/AppSidebar';
import { TemplatePickerDialog } from '@/components/TemplatePickerDialog';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { createClient } from '@/lib/supabase/clients';
import type { TemplateId } from '@/lib/templates';
import { toast } from 'sonner';

const ACTIONS = [
  { icon: Users, label: 'Inviter un collaborateur' },
  { icon: StickyNote, label: 'Ouvrir un brouillon' },
];

type Tableau = {
  id: string;
  created_at: string | null;
  owner_id: string;
  titre: string | null;
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
  const [userId, setUserId] = useState<string | null>(null);

  const loadTableaux = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/connexion');
      return;
    }

    setUserId(userData.user.id);

    // Pas de filtre .eq('owner_id', ...) ici : la policy RLS "tableaux: lecture"
    // renvoie maintenant à la fois les tableaux possédés ET ceux partagés avec
    // l'utilisateur (une fois l'invitation acceptée) via tableau_membres.
    const { data, error } = await supabase
      .from('tableaux')
      .select('id, created_at, owner_id, titre')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Impossible de charger tes tableaux.');
    } else {
      setTableaux(data ?? []);
    }
    setLoadingList(false);
  }, [router, supabase]);

  useEffect(() => {
    loadTableaux();
  }, [loadTableaux]);

  const [pickerOpen, setPickerOpen] = useState(false);

  async function createBoard(templateId: TemplateId | null, titre: string) {
    setPickerOpen(false);
    setCreating(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setCreating(false);
      router.push('/connexion');
      return;
    }

    const { data, error } = await supabase
      .from('tableaux')
      .insert({ owner_id: userData.user.id, titre })
      .select('id')
      .single();

    setCreating(false);

    if (error || !data) {
      toast.error("Impossible de créer le tableau. Réessaie.");
      return;
    }

    router.push(templateId ? `/tableau/${data.id}?template=${templateId}` : `/tableau/${data.id}`);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <EmailVerificationBanner />
        <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="md:hidden" />
          <span className="font-heading text-lg font-semibold text-foreground">Vos tableaux</span>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
              onClick={() => setPickerOpen(true)}
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

            <TemplatePickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={createBoard} />

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
                {tableaux.map((t, i) => {
                  const isOwner = t.owner_id === userId;
                  return (
                    <div
                      key={t.id}
                      className="flex animate-fade-up flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <Link href={`/tableau/${t.id}`} className="flex flex-col gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <PenLine className="h-5 w-5" />
                        </span>
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {t.titre || `Tableau du ${formatDate(t.created_at)}`}
                          {!isOwner && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                              Partagé
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-foreground/50">
                          {formatDate(t.created_at)}
                        </span>
                      </Link>

                      {isOwner && (
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <DeleteBoardDialog
                            tableauId={t.id}
                            titre={t.titre || `Tableau du ${formatDate(t.created_at)}`}
                            onDeleted={() =>
                              setTableaux((prev) => prev.filter((x) => x.id !== t.id))
                            }
                          />
                          <ShareDialog tableauId={t.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}