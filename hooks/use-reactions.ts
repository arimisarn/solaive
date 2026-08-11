'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/clients';

export type ReactionBurst = {
    id: string;
    emoji: string;
    /** Coordonnées "page" tldraw (pas écran) : chaque client reconvertit avec sa propre caméra. */
    x: number;
    y: number;
    userId: string;
    userName: string;
};

// Doit rester cohérent avec la durée de l'animation `animate-reaction-float`
// (tailwind.config.ts) : une fois l'anim finie, le burst est purgé du state.
const BURST_LIFETIME_MS = 1600;

/**
 * Réactions rapides façon Zoom/Meet : diffusées via un channel Realtime en
 * mode "broadcast" (pas de table, pas de RLS, rien de persisté). Chaque
 * burst vit quelques secondes côté client puis disparaît de lui-même.
 */
export function useReactions({
    tableauId,
    userId,
    userName,
}: {
    tableauId: string;
    userId: string;
    userName: string;
}) {
    const [bursts, setBursts] = useState<ReactionBurst[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);

    function addBurst(burst: ReactionBurst) {
        setBursts((prev) => [...prev, burst]);
        setTimeout(() => {
            setBursts((prev) => prev.filter((b) => b.id !== burst.id));
        }, BURST_LIFETIME_MS);
    }

    useEffect(() => {
        if (!tableauId) return;
        const supabase = createClient();

        // self: false — on affiche déjà notre propre burst localement dans
        // sendReaction(), inutile de faire un aller-retour serveur pour se
        // le renvoyer à soi-même.
        const channel = supabase
            .channel(`tableau_reactions:${tableauId}`, {
                config: { broadcast: { self: false } },
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                addBurst(payload as ReactionBurst);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableauId]);

    function sendReaction(emoji: string, x: number, y: number) {
        const burst: ReactionBurst = {
            id: `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            emoji,
            x,
            y,
            userId,
            userName,
        };
        channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: burst });
        addBurst(burst);
    }

    return { bursts, sendReaction };
}
