'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';
import { toast } from 'sonner';

/**
 * Favoris de l'utilisateur courant (table tableau_favoris, RLS : chacun ne
 * voit/modifie que ses propres lignes — pas besoin de RPC ici, contrairement
 * aux fonctionnalités liées aux collaborateurs).
 *
 * On charge l'ensemble des ids favoris une fois, puis on fait des mises à
 * jour optimistes locales (le Set est mis à jour immédiatement ; en cas
 * d'erreur serveur on revient en arrière et on prévient l'utilisateur).
 */
export function useFavoris() {
    const [favoris, setFavoris] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            setFavoris(new Set());
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('tableau_favoris')
            .select('tableau_id')
            .eq('user_id', userData.user.id);

        if (error) {
            console.error('tableau_favoris:', error.message);
        } else {
            setFavoris(new Set((data ?? []).map((row) => row.tableau_id as string)));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const isFavori = useCallback((tableauId: string) => favoris.has(tableauId), [favoris]);

    const toggleFavori = useCallback(async (tableauId: string) => {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const wasFavori = favoris.has(tableauId);

        // Mise à jour optimiste.
        setFavoris((prev) => {
            const next = new Set(prev);
            if (wasFavori) next.delete(tableauId);
            else next.add(tableauId);
            return next;
        });

        const { error } = wasFavori
            ? await supabase
                  .from('tableau_favoris')
                  .delete()
                  .eq('user_id', userData.user.id)
                  .eq('tableau_id', tableauId)
            : await supabase
                  .from('tableau_favoris')
                  .insert({ user_id: userData.user.id, tableau_id: tableauId });

        if (error) {
            // Rollback si l'écriture a échoué.
            setFavoris((prev) => {
                const next = new Set(prev);
                if (wasFavori) next.add(tableauId);
                else next.delete(tableauId);
                return next;
            });
            toast.error("Impossible de mettre à jour les favoris.");
        }
    }, [favoris]);

    return { favoris, isFavori, toggleFavori, loading, reload: load };
}
