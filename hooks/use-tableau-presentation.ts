'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';

export type PresentationState = {
    tableau_id: string;
    presentateur_id: string | null;
    presentateur_nom: string | null;
    updated_at: string;
};

type MutationResult = { error: string | null };

/**
 * État partagé et persisté du "présentateur" courant pour ce tableau.
 * Ce hook ne touche PAS à l'éditeur tldraw lui-même (caméra, lecture seule) —
 * ça, c'est le rôle de usePresentationFollow, qui consomme cet état.
 */
export function useTableauPresentation({ tableauId }: { tableauId: string }) {
    const [state, setState] = useState<PresentationState | null>(null);
    const [loading, setLoading] = useState(true);

    // Relit directement la ligne en base, en plus du canal realtime : même
    // précaution que pour le minuteur, pour que l'auteur de l'action voie
    // le résultat même si Realtime n'est pas actif pour cette table.
    async function refresh() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tableau_presentations')
            .select('*')
            .eq('tableau_id', tableauId)
            .maybeSingle();

        if (error) {
            console.error('Chargement présentation:', error.message);
            return;
        }
        setState((data as PresentationState | null) ?? null);
    }

    useEffect(() => {
        if (!tableauId) return;
        const supabase = createClient();
        let cancelled = false;

        async function load() {
            setLoading(true);
            await refresh();
            if (!cancelled) setLoading(false);
        }

        load();

        const channel = supabase
            .channel(`tableau_presentations:${tableauId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tableau_presentations',
                    filter: `tableau_id=eq.${tableauId}`,
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') setState(null);
                    else setState(payload.new as PresentationState);
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [tableauId]);

    async function start(nom: string): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('demarrer_presentation', {
            p_tableau_id: tableauId,
            p_nom: nom,
        });
        if (error) console.error('demarrer_presentation:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function stop(): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('arreter_presentation', { p_tableau_id: tableauId });
        if (error) console.error('arreter_presentation:', error.message);
        else setState(null);
        return { error: error?.message ?? null };
    }

    return { state, loading, start, stop };
}
