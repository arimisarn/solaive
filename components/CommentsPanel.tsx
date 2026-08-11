'use client';

import { useMemo, useState } from 'react';
import { MessageSquareText, MessageSquare, X, Plus } from 'lucide-react';
import type { Commentaire } from '@/hooks/use-tableau-comments';

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function CommentsPanel({
    comments,
    loading,
    unreadCount,
    open,
    onOpenChange,
    onStartPlacing,
    onSelectThread,
    currentUserId,
}: {
    comments: Commentaire[];
    loading: boolean;
    unreadCount: number;
    /** Ouverture contrôlée par le parent, pour rester exclusif avec les autres panneaux flottants (chat, historique). */
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartPlacing: () => void;
    onSelectThread: (comment: Commentaire) => void;
    currentUserId: string;
}) {
    const [showResolved, setShowResolved] = useState(false);

    const roots = useMemo(() => {
        const replyCounts = new Map<string, number>();
        for (const c of comments) {
            if (!c.parent_id) continue;
            replyCounts.set(c.parent_id, (replyCounts.get(c.parent_id) ?? 0) + 1);
        }
        return comments
            .filter((c) => c.parent_id === null && (showResolved || !c.resolu))
            .map((c) => ({ ...c, replyCount: replyCounts.get(c.id) ?? 0 }))
            .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    }, [comments, showResolved]);

    return (
        <>
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
                title="Commentaires"
            >
                <MessageSquareText className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="pointer-events-auto fixed bottom-3 right-3 z-[300] flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                        <p className="font-heading text-sm font-medium text-foreground">Commentaires</p>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="text-foreground/40 hover:text-foreground/70"
                            aria-label="Fermer les commentaires"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                        <button
                            type="button"
                            onClick={onStartPlacing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nouveau
                        </button>
                        <label className="flex items-center gap-1.5 text-[11px] text-foreground/60">
                            <input
                                type="checkbox"
                                checked={showResolved}
                                onChange={(e) => setShowResolved(e.target.checked)}
                                className="h-3 w-3 accent-accent"
                            />
                            Afficher les résolus
                        </label>
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto px-2 py-2">
                        {loading ? (
                            <div className="px-1 py-4 text-sm text-foreground/60">Chargement…</div>
                        ) : roots.length === 0 ? (
                            <p className="py-4 text-center text-sm text-foreground/50">
                                Aucun commentaire{showResolved ? '' : ' non résolu'} pour l&apos;instant.
                            </p>
                        ) : (
                            roots.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => onSelectThread(c)}
                                    className="flex w-full flex-col gap-0.5 rounded-lg border border-border/60 bg-background px-2.5 py-2 text-left transition-colors hover:border-accent/40"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-xs font-medium text-foreground/80">
                                            {c.user_id === currentUserId ? 'Toi' : c.auteur_nom}
                                        </span>
                                        <span className="shrink-0 text-[10px] text-foreground/40">
                                            {formatDate(c.created_at)}
                                        </span>
                                    </div>
                                    <p className="line-clamp-2 text-sm text-foreground/70">{c.contenu}</p>
                                    {(c.resolu || c.replyCount > 0) && (
                                        <div className="flex items-center gap-2 pt-0.5">
                                            {c.resolu && (
                                                <span className="text-[10px] font-medium text-emerald-600">
                                                    Résolu
                                                </span>
                                            )}
                                            {c.replyCount > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] text-foreground/40">
                                                    <MessageSquare className="h-3 w-3" />
                                                    {c.replyCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
