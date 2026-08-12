'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/AppSidebar';
import { TrashItemCard, type TableauCorbeille } from '@/components/TrashItemCard';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { createClient } from '@/lib/supabase/clients';

export default function CorbeillePage() {
    const router = useRouter();
    const supabase = createClient();
    const [tableaux, setTableaux] = useState<TableauCorbeille[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            router.push('/connexion');
            return;
        }

        const { data, error } = await supabase.rpc('lister_corbeille');
        if (error) {
            toast.error('Impossible de charger la corbeille.');
        } else {
            setTableaux(data ?? []);
        }
        setLoading(false);
    }, [router, supabase]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleRestore(id: string) {
        const { error } = await supabase.rpc('restaurer_tableau', { p_tableau_id: id });
        if (error) {
            toast.error('Impossible de restaurer le tableau.');
            return;
        }
        toast.success('Tableau restauré.');
        setTableaux((prev) => prev.filter((t) => t.id !== id));
    }

    async function handlePurge(id: string) {
        const { error } = await supabase.rpc('purger_tableau', { p_tableau_id: id });
        if (error) {
            toast.error('Impossible de supprimer le tableau.');
            return;
        }
        toast.success('Tableau supprimé définitivement.');
        setTableaux((prev) => prev.filter((t) => t.id !== id));
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Corbeille</span>
                </header>

                <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex animate-fade-up items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground/40">
                            <Trash2 className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                Corbeille
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Les tableaux supprimés restent ici jusqu&apos;à ce que tu les restaures ou les
                                supprimes définitivement.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        {loading ? (
                            <div className="flex items-center gap-2 text-foreground/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement…
                            </div>
                        ) : tableaux.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                                <Trash2 className="h-6 w-6 text-foreground/40" />
                                <p className="text-sm text-foreground/60">La corbeille est vide.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {tableaux.map((t, i) => (
                                    <TrashItemCard
                                        key={t.id}
                                        tableau={t}
                                        onRestore={handleRestore}
                                        onPurge={handlePurge}
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