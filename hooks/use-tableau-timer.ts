'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';

export type MinuteurState = {
    tableau_id: string;
    duree_secondes: number;
    /** ISO timestamp de fin si le minuteur tourne, sinon null. Source de vérité : le serveur. */
    fin_a: string | null;
    /** Secondes restantes figées au moment de la mise en pause, sinon null. */
    pause_restant_secondes: number | null;
    demarre_par: string | null;
    updated_at: string;
};

type MutationResult = { error: string | null };

/**
 * Minuteur partagé, collaboratif : n'importe quel participant peut démarrer,
 * mettre en pause, reprendre ou réinitialiser — pas de notion de
 * "présentateur" ici (ça, c'est la brique séparée du mode présentateur).
 *
 * Le temps restant n'est PAS calculé à partir d'un compteur local qui
 * dériverait entre les clients : chaque tick relit `fin_a` (horodatage
 * serveur absolu) et recalcule la différence avec `Date.now()`, donc tous
 * les participants voient le même compte à rebours à la seconde près, même
 * en rejoignant en cours de route.
 */
export function useTableauTimer({ tableauId }: { tableauId: string }) {
    const [state, setState] = useState<MinuteurState | null>(null);
    const [loading, setLoading] = useState(true);
    const [remaining, setRemaining] = useState(0);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Relit directement la ligne en base. Appelée au montage ET après chaque
    // mutation locale : on ne dépend PAS uniquement du canal realtime pour
    // que l'auteur de l'action voie le résultat — si Realtime n'est pas
    // activé pour la table (ex. la dernière ligne du SQL a échoué), les
    // AUTRES participants ne verront rien bouger, mais au moins la personne
    // qui vient de cliquer "Démarrer" voit son propre minuteur démarrer.
    async function refresh() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tableau_minuteurs')
            .select('*')
            .eq('tableau_id', tableauId)
            .maybeSingle();

        if (error) {
            console.error('Chargement minuteur:', error.message);
            return;
        }
        setState((data as MinuteurState | null) ?? null);
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
            .channel(`tableau_minuteurs:${tableauId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tableau_minuteurs', filter: `tableau_id=eq.${tableauId}` },
                (payload) => {
                    if (payload.eventType === 'DELETE') setState(null);
                    else setState(payload.new as MinuteurState);
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [tableauId]);

    // Tick d'affichage : une fois par seconde pendant que le minuteur tourne,
    // recalculé depuis `fin_a` à chaque fois (pas d'accumulation d'erreur).
    useEffect(() => {
        if (tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
        }

        function computeRemaining(): number {
            if (!state) return 0;
            if (state.fin_a) {
                return Math.max(0, Math.round((new Date(state.fin_a).getTime() - Date.now()) / 1000));
            }
            if (state.pause_restant_secondes !== null) return state.pause_restant_secondes;
            return state.duree_secondes;
        }

        setRemaining(computeRemaining());

        if (state?.fin_a) {
            tickRef.current = setInterval(() => setRemaining(computeRemaining()), 1000);
        }

        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [state]);

    async function start(dureeSecondes: number): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('demarrer_minuteur', {
            p_tableau_id: tableauId,
            p_duree_secondes: dureeSecondes,
        });
        if (error) console.error('demarrer_minuteur:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function pause(): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('mettre_en_pause_minuteur', { p_tableau_id: tableauId });
        if (error) console.error('mettre_en_pause_minuteur:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function resume(): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('reprendre_minuteur', { p_tableau_id: tableauId });
        if (error) console.error('reprendre_minuteur:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function reset(): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('reinitialiser_minuteur', { p_tableau_id: tableauId });
        if (error) console.error('reinitialiser_minuteur:', error.message);
        else setState(null);
        return { error: error?.message ?? null };
    }

    const running = !!state?.fin_a;
    const paused = !running && state?.pause_restant_secondes != null;

    return { state, loading, remaining, running, paused, start, pause, resume, reset };
}