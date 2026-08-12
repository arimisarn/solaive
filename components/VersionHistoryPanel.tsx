'use client';

import { useEffect, useState } from 'react';
import { History, X, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type VersionRow = {
    id: string;
    created_at: string;
    label: string | null;
};

const SYNC_SERVER_URL = process.env.NEXT_PUBLIC_SYNC_SERVER_URL;

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function VersionHistoryPanel({
    tableauId,
    open,
    onOpenChange,
}: {
    tableauId: string;
    /** Ouverture contrôlée par le parent, pour rester exclusif avec d'autres panneaux flottants (ex. chat). */
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState<VersionRow[]>([]);
    const [restoring, setRestoring] = useState(false);
    const [pendingVersion, setPendingVersion] = useState<VersionRow | null>(null);

    async function loadVersions() {
        setLoading(true);
        // Ne récupère pas `snapshot` (potentiellement volumineux) : la liste
        // n'a besoin que des métadonnées, le snapshot complet reste côté
        // serveur de sync qui le relit lui-même au moment de la restauration.
        const { data, error } = await supabase
            .from('tableau_versions')
            .select('id, created_at, label')
            .eq('tableau_id', tableauId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            toast.error("Impossible de charger l'historique des versions.");
        } else {
            setVersions(data ?? []);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (open) loadVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function handleRestore(version: VersionRow) {
        setRestoring(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
            toast.error('Session expirée, recharge la page.');
            setRestoring(false);
            return;
        }

        try {
            const res = await fetch(`${SYNC_SERVER_URL}/restore/${tableauId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ versionId: version.id }),
            });

            if (!res.ok) throw new Error(await res.text());

            toast.success('Version restaurée. Le tableau va se recharger.');
            setPendingVersion(null);
            onOpenChange(false);
            // Le serveur a fait un loadSnapshot() sur la room active, ce qui
            // déconnecte la session websocket en cours ; on recharge la page
            // pour repartir sur une connexion propre plutôt que de compter
            // sur la reconnexion automatique du provider pour tout re-render.
            window.location.reload();
        } catch {
            toast.error("La restauration a échoué. Réessaie.");
        } finally {
            setRestoring(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
                title="Historique des versions"
            >
                <History className="h-4 w-4" />
            </button>

            {open && (
                <div className="pointer-events-auto fixed bottom-3 right-3 z-[300] flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                        <p className="font-heading text-sm font-medium text-foreground">
                            Historique des versions
                        </p>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="text-foreground/40 hover:text-foreground/70"
                            aria-label="Fermer l'historique"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
                        {loading ? (
                            <div className="flex items-center gap-2 py-4 px-1 text-sm text-foreground/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement…
                            </div>
                        ) : versions.length === 0 ? (
                            <p className="py-4 text-center text-sm text-foreground/50">
                                Aucune version enregistrée pour l&apos;instant.
                            </p>
                        ) : (
                            versions.map((v) => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-foreground/90">
                                            {formatDate(v.created_at)}
                                        </p>
                                        {v.label && (
                                            <p className="truncate text-[11px] text-accent">{v.label}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPendingVersion(v)}
                                        className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Restaurer
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <AlertDialog
                open={!!pendingVersion}
                onOpenChange={(next) => !restoring && !next && setPendingVersion(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurer cette version ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingVersion && (
                                <>
                                    Le tableau reviendra à son état du{' '}
                                    <span className="font-medium text-foreground">
                                        {formatDate(pendingVersion.created_at)}
                                    </span>
                                    . Cette action n&apos;efface rien de l&apos;historique : l&apos;état actuel
                                    reste disponible comme version précédente. Les participants connectés
                                    seront brièvement déconnectés le temps de la restauration.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={restoring}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                if (pendingVersion) handleRestore(pendingVersion);
                            }}
                            disabled={restoring}
                        >
                            {restoring ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restauration…
                                </>
                            ) : (
                                'Restaurer'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}