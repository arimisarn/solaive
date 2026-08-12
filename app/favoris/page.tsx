'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { TableauCard, type TableauAvecStats } from '@/components/TableauCard';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { useFavoris } from '@/hooks/use-favoris';
import { createClient } from '@/lib/supabase/clients';
import { toast } from 'sonner';

export default function FavorisPage() {
    const router = useRouter();
    const supabase = createClient();
    const [tableaux, setTableaux] = useState<TableauAvecStats[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const { favoris, loading: loadingFavoris, toggleFavori } = useFavoris();

    const load = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            router.push('/connexion');
            return;
        }
        setUserId(userData.user.id);

        const { data, error } = await supabase.rpc('lister_mes_tableaux');
        if (error) {
            toast.error('Impossible de charger tes tableaux.');
        } else {
            setTableaux(data ?? []);
        }
        setLoadingList(false);
    }, [router, supabase]);

    useEffect(() => {
        load();
    }, [load]);

    const loading = loadingList || loadingFavoris;
    const epingles = tableaux.filter((t) => favoris.has(t.id));

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Favoris</span>
                </header>

                <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex animate-fade-up items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <Star className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                Favoris
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Les tableaux que tu as épinglés, pour les retrouver vite.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        {loading ? (
                            <div className="flex items-center gap-2 text-foreground/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement…
                            </div>
                        ) : epingles.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                                <Star className="h-6 w-6 text-foreground/40" />
                                <p className="text-sm text-foreground/60">
                                    Aucun tableau épinglé pour l&apos;instant.
                                </p>
                                <p className="text-xs text-foreground/40">
                                    Clique sur l&apos;étoile d&apos;un tableau depuis le tableau de bord pour l&apos;ajouter ici.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {epingles.map((t, i) => (
                                    <TableauCard
                                        key={t.id}
                                        tableau={t}
                                        isOwner={t.owner_id === userId}
                                        isFavori
                                        onToggleFavori={toggleFavori}
                                        onDeleted={(id) =>
                                            setTableaux((prev) => prev.filter((x) => x.id !== id))
                                        }
                                        onDuplicated={load}
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