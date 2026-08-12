'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';
import { computeTally, findMyVote } from '@/lib/sondage-utils';

export type SondageOption = { id: string; texte: string };

export type Sondage = {
    id: string;
    tableau_id: string;
    question: string;
    options: SondageOption[];
    cree_par: string;
    termine: boolean;
    created_at: string;
};

export type SondageVote = {
    sondage_id: string;
    user_id: string;
    option_id: string;
};

type MutationResult = { error: string | null };

/**
 * Sondage actif (ou dernier clôturé) d'un tableau, en direct.
 *
 * Un seul sondage "ouvert" à la fois par tableau : `creer_sondage` refuse
 * d'en créer un nouveau tant qu'un précédent n'est pas clôturé ou supprimé
 * (même logique que le mode présentateur : un seul état actif partagé).
 * L'historique reste en base (table à plusieurs lignes, pas une ligne par
 * tableau_id comme le minuteur), mais ce hook n'expose que le plus récent.
 */
export function useTableauSondage({ tableauId, userId }: { tableauId: string; userId: string }) {
    const [poll, setPoll] = useState<Sondage | null>(null);
    const [votes, setVotes] = useState<SondageVote[]>([]);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        const supabase = createClient();
        const { data: pollData, error: pollError } = await supabase
            .from('tableau_sondages')
            .select('*')
            .eq('tableau_id', tableauId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (pollError) {
            console.error('Chargement sondage:', pollError.message);
            return;
        }

        const current = (pollData as Sondage | null) ?? null;
        setPoll(current);

        if (!current) {
            setVotes([]);
            return;
        }

        const { data: votesData, error: votesError } = await supabase
            .from('tableau_sondage_votes')
            .select('*')
            .eq('sondage_id', current.id);

        if (votesError) {
            console.error('Chargement votes:', votesError.message);
            return;
        }
        setVotes((votesData as SondageVote[] | null) ?? []);
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

        // Un seul canal pour les deux tables : les votes n'ont pas de colonne
        // tableau_id (ils référencent sondage_id), donc pas de filtre postgres
        // possible côté serveur — on relit tout à chaque événement pertinent,
        // ce qui reste très léger vu la fréquence d'usage de cette brique.
        const channel = supabase
            .channel(`tableau_sondages:${tableauId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tableau_sondages', filter: `tableau_id=eq.${tableauId}` },
                () => refresh()
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tableau_sondage_votes' }, () => refresh())
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [tableauId]);

    async function create(question: string, optionsTexte: string[]): Promise<MutationResult> {
        const supabase = createClient();
        const { error } = await supabase.rpc('creer_sondage', {
            p_tableau_id: tableauId,
            p_question: question,
            p_options: optionsTexte,
        });
        if (error) console.error('creer_sondage:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function vote(optionId: string): Promise<MutationResult> {
        if (!poll) return { error: 'Aucun sondage actif.' };
        const supabase = createClient();
        const { error } = await supabase.rpc('voter_sondage', {
            p_sondage_id: poll.id,
            p_option_id: optionId,
        });
        if (error) console.error('voter_sondage:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function removeVote(): Promise<MutationResult> {
        if (!poll) return { error: 'Aucun sondage actif.' };
        const supabase = createClient();
        const { error } = await supabase.rpc('retirer_vote', { p_sondage_id: poll.id });
        if (error) console.error('retirer_vote:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function close(): Promise<MutationResult> {
        if (!poll) return { error: 'Aucun sondage actif.' };
        const supabase = createClient();
        const { error } = await supabase.rpc('cloturer_sondage', { p_sondage_id: poll.id });
        if (error) console.error('cloturer_sondage:', error.message);
        else await refresh();
        return { error: error?.message ?? null };
    }

    async function remove(): Promise<MutationResult> {
        if (!poll) return { error: 'Aucun sondage actif.' };
        const supabase = createClient();
        const { error } = await supabase.rpc('supprimer_sondage', { p_sondage_id: poll.id });
        if (error) console.error('supprimer_sondage:', error.message);
        else {
            setPoll(null);
            setVotes([]);
        }
        return { error: error?.message ?? null };
    }

    const myVote = useMemo(() => findMyVote(votes, userId), [votes, userId]);

    const tally = useMemo(() => computeTally(votes), [votes]);

    return {
        poll,
        votes,
        loading,
        myVote,
        tally,
        totalVotes: votes.length,
        create,
        vote,
        removeVote,
        close,
        remove,
    };
}