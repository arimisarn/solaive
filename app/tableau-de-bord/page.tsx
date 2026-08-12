'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PenLine, Users, StickyNote, Loader2, LayoutGrid, Search, Star, X } from 'lucide-react';
import { EmailVerificationBanner } from '@/components/auth/EmailVerificationBanner';
import { AppSidebar } from '@/components/AppSidebar';
import { TemplatePickerDialog } from '@/components/TemplatePickerDialog';
import { TableauCard, type TableauAvecStats } from '@/components/TableauCard';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { useFavoris } from '@/hooks/use-favoris';
import { createClient } from '@/lib/supabase/clients';
import type { TemplateId } from '@/lib/templates';
import { toast } from 'sonner';

const ACTIONS = [
  { icon: Users, label: 'Inviter un collaborateur' },
  { icon: StickyNote, label: 'Ouvrir un brouillon' },
];

export default function TableauDeBordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [creating, setCreating] = useState(false);
  const [tableaux, setTableaux] = useState<TableauAvecStats[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { favoris, toggleFavori } = useFavoris();

  const loadTableaux = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/connexion');
      return;
    }

    setUserId(userData.user.id);

    // lister_mes_tableaux (RPC) réplique la policy RLS "tableaux: lecture"
    // (owner OU membre accepté) et ajoute le nombre de collaborateurs par
    // tableau en une seule requête plutôt qu'un select direct + N requêtes.
    const { data, error } = await supabase.rpc('lister_mes_tableaux');

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

  function handleDeleted(id: string) {
    setTableaux((prev) => prev.filter((x) => x.id !== id));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tableaux;
    return tableaux.filter((t) => (t.titre || '').toLowerCase().includes(q));
  }, [tableaux, query]);

  const epingles = useMemo(
    () => filtered.filter((t) => favoris.has(t.id)),
    [filtered, favoris]
  );
  const reste = useMemo(
    () => filtered.filter((t) => !favoris.has(t.id)),
    [filtered, favoris]
  );

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

          {!loadingList && tableaux.length > 0 && (
            <div className="relative mt-10 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un tableau…"
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-8 text-sm outline-none focus:border-accent/50"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {epingles.length > 0 && (
            <div className="mt-10">
              <h2 className="flex items-center gap-1.5 font-heading text-xl font-bold text-foreground">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                Épinglés
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {epingles.map((t, i) => (
                  <TableauCard
                    key={t.id}
                    tableau={t}
                    isOwner={t.owner_id === userId}
                    isFavori
                    onToggleFavori={toggleFavori}
                    onDeleted={handleDeleted}
                    animationDelay={`${i * 0.05}s`}
                  />
                ))}
              </div>
            </div>
          )}

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
                  Tu n&apos;as pas encore de tableau. Crée le premier ci-dessus.
                </p>
              </div>
            ) : reste.length === 0 ? (
              <p className="mt-6 text-sm text-foreground/50">
                {query ? 'Aucun tableau ne correspond à ta recherche.' : 'Tous tes tableaux sont épinglés ci-dessus.'}
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reste.map((t, i) => (
                  <TableauCard
                    key={t.id}
                    tableau={t}
                    isOwner={t.owner_id === userId}
                    isFavori={false}
                    onToggleFavori={toggleFavori}
                    onDeleted={handleDeleted}
                    animationDelay={`${i * 0.05}s`}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}