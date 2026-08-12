'use client';

import { useState } from 'react';
import { PenLine, RotateCcw, Trash2, Loader2, Clock } from 'lucide-react';
import { formatActiviteRelative } from '@/lib/date-utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type TableauCorbeille = {
    id: string;
    titre: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    owner_id: string;
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function TrashItemCard({
    tableau,
    onRestore,
    onPurge,
    animationDelay,
}: {
    tableau: TableauCorbeille;
    onRestore: (id: string) => Promise<void>;
    onPurge: (id: string) => Promise<void>;
    animationDelay?: string;
}) {
    const [restoring, setRestoring] = useState(false);
    const [purging, setPurging] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const titre = tableau.titre || `Tableau du ${formatDate(tableau.created_at)}`;
    const busy = restoring || purging;

    async function handleRestore() {
        setRestoring(true);
        await onRestore(tableau.id);
        setRestoring(false);
    }

    async function handlePurge() {
        setPurging(true);
        await onPurge(tableau.id);
        setPurging(false);
        setConfirmOpen(false);
    }

    return (
        <div
            className="flex animate-fade-up flex-col gap-2 rounded-xl border border-border bg-card p-5 opacity-90 transition-all hover:opacity-100"
            style={animationDelay ? { animationDelay } : undefined}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5 text-foreground/40">
                        <PenLine className="h-5 w-5" />
                    </span>
                    <span className="truncate text-sm font-medium text-foreground/80">{titre}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-foreground/50">
                <span className="inline-flex items-center gap-1" title="Déplacé vers la corbeille">
                    <Clock className="h-3 w-3" />
                    Supprimé {formatActiviteRelative(tableau.deleted_at)}
                </span>
            </div>

            <div className="mt-1 flex items-center justify-end gap-1">
                <button
                    type="button"
                    onClick={handleRestore}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent disabled:opacity-60"
                >
                    {restoring ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                    Restaurer
                </button>

                <AlertDialog open={confirmOpen} onOpenChange={(next) => !busy && setConfirmOpen(next)}>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer définitivement ce tableau ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Le tableau <span className="font-medium text-foreground">« {titre} »</span> et
                                tout son contenu seront définitivement supprimés. Cette action est irréversible.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={purging}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePurge();
                                }}
                                disabled={purging}
                                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                            >
                                {purging ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Suppression…
                                    </>
                                ) : (
                                    'Supprimer définitivement'
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
