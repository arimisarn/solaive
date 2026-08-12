'use client';

import Link from 'next/link';
import { PenLine, Star, Users, Clock } from 'lucide-react';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { formatActiviteRelative } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export type TableauAvecStats = {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    owner_id: string;
    titre: string | null;
    nb_collaborateurs: number;
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function TableauCard({
    tableau,
    isOwner,
    isFavori,
    onToggleFavori,
    onDeleted,
    animationDelay,
}: {
    tableau: TableauAvecStats;
    isOwner: boolean;
    isFavori: boolean;
    onToggleFavori: (id: string) => void;
    onDeleted?: (id: string) => void;
    animationDelay?: string;
}) {
    const titre = tableau.titre || `Tableau du ${formatDate(tableau.created_at)}`;

    return (
        <div
            className="flex animate-fade-up flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
            style={animationDelay ? { animationDelay } : undefined}
        >
            <div className="flex items-start justify-between gap-2">
                <Link href={`/tableau/${tableau.id}`} className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <PenLine className="h-5 w-5" />
                    </span>
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="truncate">{titre}</span>
                        {!isOwner && (
                            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                                Partagé
                            </span>
                        )}
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onToggleFavori(tableau.id);
                    }}
                    aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    aria-pressed={isFavori}
                    className={cn(
                        'shrink-0 rounded-lg p-1.5 transition-colors hover:bg-accent/10',
                        isFavori ? 'text-amber-500' : 'text-foreground/30 hover:text-amber-500'
                    )}
                >
                    <Star className={cn('h-4 w-4', isFavori && 'fill-current')} />
                </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-foreground/50">
                <span className="inline-flex items-center gap-1" title="Dernière activité">
                    <Clock className="h-3 w-3" />
                    {formatActiviteRelative(tableau.updated_at ?? tableau.created_at)}
                </span>
                {tableau.nb_collaborateurs > 0 && (
                    <span className="inline-flex items-center gap-1" title="Collaborateurs">
                        <Users className="h-3 w-3" />
                        {tableau.nb_collaborateurs}
                    </span>
                )}
            </div>

            {isOwner && (
                <div className="mt-1 flex items-center justify-end gap-1">
                    <DeleteBoardDialog
                        tableauId={tableau.id}
                        titre={titre}
                        onDeleted={() => onDeleted?.(tableau.id)}
                    />
                    <ShareDialog tableauId={tableau.id} isOwner />
                </div>
            )}
        </div>
    );
}
