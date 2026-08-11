'use client';

import { Presentation, Square } from 'lucide-react';
import { toast } from 'sonner';

export function PresentationButton({
    presentateurId,
    presentateurNom,
    currentUserId,
    isOwner,
    onStart,
    onStop,
}: {
    presentateurId: string | null;
    presentateurNom: string | null;
    currentUserId: string;
    isOwner: boolean;
    onStart: () => Promise<{ error: string | null }>;
    onStop: () => Promise<{ error: string | null }>;
}) {
    const isPresenting = presentateurId === currentUserId;
    const canStop = isPresenting || isOwner;

    async function handleStart() {
        const res = await onStart();
        if (res.error) toast.error("Impossible de démarrer la présentation.");
    }

    async function handleStop() {
        const res = await onStop();
        if (res.error) toast.error("Impossible d'arrêter la présentation.");
    }

    if (!presentateurId) {
        return (
            <button
                type="button"
                onClick={handleStart}
                title="Démarrer une présentation : les autres suivront ta vue, le tableau passe en lecture seule pour eux"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
            >
                <Presentation className="h-4 w-4" />
            </button>
        );
    }

    return (
        <div className="flex h-9 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 text-xs font-medium text-accent shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="max-w-[120px] truncate">
                {isPresenting ? 'Tu présentes' : `${presentateurNom ?? 'Quelqu\'un'} présente`}
            </span>
            {canStop && (
                <button
                    type="button"
                    onClick={handleStop}
                    title="Arrêter la présentation"
                    className="ml-0.5 shrink-0 text-accent/70 hover:text-accent"
                >
                    <Square className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
