'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PenLine, Star, Users, Clock, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteBoardDialog } from '@/components/DeleteBoardDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { formatActiviteRelative } from '@/lib/date-utils';
import { createClient } from '@/lib/supabase/clients';
import { cn } from '@/lib/utils';

export type TableauAvecStats = {
    id: string;
    created_at: string | null;
    updated_at: string | null;
    owner_id: string;
    titre: string | null;
    nb_collaborateurs: number;
    owner_email: string | null;
    collaborateurs_emails: string[] | null;
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
    onDuplicated,
    animationDelay,
}: {
    tableau: TableauAvecStats;
    isOwner: boolean;
    isFavori: boolean;
    onToggleFavori: (id: string) => void;
    onDeleted?: (id: string) => void;
    /** Appelé une fois la copie créée en base, pour rafraîchir la liste. */
    onDuplicated?: () => void;
    animationDelay?: string;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [duplicating, setDuplicating] = useState(false);
    const titre = tableau.titre || `Tableau du ${formatDate(tableau.created_at)}`;

    async function handleDuplicate() {
        setDuplicating(true);
        const { data: newId, error } = await supabase.rpc('dupliquer_tableau', {
            p_tableau_id: tableau.id,
        });
        setDuplicating(false);

        if (error || !newId) {
            toast.error('Impossible de dupliquer le tableau. Réessaie.');
            return;
        }

        toast.success('Tableau dupliqué.');
        onDuplicated?.();
        router.push(`/tableau/${newId}`);
    }

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
                    {!isOwner && tableau.owner_email && (
                        <span className="truncate text-xs text-foreground/45">
                            Partagé par {tableau.owner_email}
                        </span>
                    )}
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
                    <span
                        className="inline-flex min-w-0 items-center gap-1"
                        title={
                            isOwner && tableau.collaborateurs_emails
                                ? tableau.collaborateurs_emails.join(', ')
                                : 'Collaborateurs'
                        }
                    >
                        <Users className="h-3 w-3 shrink-0" />
                        {isOwner && tableau.collaborateurs_emails?.length ? (
                            <span className="truncate">
                                {tableau.collaborateurs_emails.slice(0, 2).join(', ')}
                                {tableau.collaborateurs_emails.length > 2
                                    ? ` +${tableau.collaborateurs_emails.length - 2}`
                                    : ''}
                            </span>
                        ) : (
                            tableau.nb_collaborateurs
                        )}
                    </span>
                )}
            </div>

            <div className="mt-1 flex items-center justify-end gap-1">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        handleDuplicate();
                    }}
                    disabled={duplicating}
                    title="Dupliquer"
                    aria-label="Dupliquer"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/80 transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent disabled:opacity-60"
                >
                    {duplicating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </button>

                {isOwner && (
                    <>
                        <DeleteBoardDialog
                            tableauId={tableau.id}
                            titre={titre}
                            onDeleted={() => onDeleted?.(tableau.id)}
                            trigger={
                                <button
                                    type="button"
                                    title="Supprimer"
                                    aria-label="Supprimer"
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/80 transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            }
                        />
                        <ShareDialog
                            tableauId={tableau.id}
                            isOwner
                            trigger={
                                <button
                                    type="button"
                                    title="Partager"
                                    aria-label="Partager"
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-foreground/80 transition-colors hover:border-accent/40 hover:text-accent"
                                >
                                    <Users className="h-4 w-4" />
                                </button>
                            }
                        />
                    </>
                )}
            </div>
        </div>
    );
}