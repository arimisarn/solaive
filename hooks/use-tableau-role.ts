'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';

export type TableauRole = 'lecture' | 'edition' | 'admin';

/**
 * Rôle de l'utilisateur courant sur ce tableau. Passe par la fonction SQL
 * `obtenir_mon_role` (security definer) plutôt qu'un select direct sur
 * tableau_membres, pour rester cohérent avec le reste du projet où toute
 * lecture sensible passe par une fonction dédiée plutôt que la table brute.
 *
 * Fallback fail-closed : en cas d'erreur ou de valeur inattendue, on retombe
 * sur 'lecture' plutôt que 'edition' — mieux vaut restreindre à tort qu'ouvrir
 * l'édition à quelqu'un qui ne devrait pas l'avoir.
 */
export function useTableauRole({ tableauId, isOwner }: { tableauId: string; isOwner: boolean }) {
    const [role, setRole] = useState<TableauRole | null>(isOwner ? 'admin' : null);
    const [loading, setLoading] = useState(!isOwner);

    useEffect(() => {
        if (isOwner) {
            console.log(`[DEBUG role] ${new Date().toISOString()} isOwner=true => role=admin`);
            setRole('admin');
            setLoading(false);
            return;
        }
        if (!tableauId) return;

        let cancelled = false;
        async function load() {
            console.log(`[DEBUG role] ${new Date().toISOString()} isOwner=false, appel obtenir_mon_role...`);
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase.rpc('obtenir_mon_role', { p_tableau_id: tableauId });
            if (cancelled) {
                console.log(`[DEBUG role] ${new Date().toISOString()} réponse obtenir_mon_role ignorée (cancelled=true)`);
                return;
            }

            if (error) {
                console.error('obtenir_mon_role:', error.message);
                console.log(`[DEBUG role] ${new Date().toISOString()} erreur RPC => role=lecture (fail-closed)`);
                setRole('lecture');
            } else {
                const value = data as TableauRole | null;
                const resolved = value === 'edition' || value === 'admin' || value === 'lecture' ? value : 'lecture';
                console.log(`[DEBUG role] ${new Date().toISOString()} RPC a répondu data="${value}" => role=${resolved}`);
                setRole(resolved);
            }
            setLoading(false);
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [tableauId, isOwner]);

    return {
        role,
        loading,
        isReadonly: role === 'lecture',
        canManageSharing: role === 'admin',
    };
}