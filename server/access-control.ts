// server/access-control.ts
//
// Logique de résolution de rôle extraite de server/index.ts pour être
// testable en isolation (le client Supabase est injecté, donc simulable en
// test sans base de données réelle). Réplique en JS la logique de la
// fonction SQL `tableau_est_accessible` : le serveur de sync tourne avec la
// clé service_role (qui contourne RLS), donc l'accès doit être vérifié à la
// main avant toute opération sensible.
//
// Comportement :
//   - le owner du tableau a toujours le rôle 'admin', quoi qu'il arrive
//   - sinon, le rôle vient de tableau_membres (uniquement si statut='acceptee')
//   - aucune ligne trouvée (ou tableau inexistant) => null (accès refusé)
//   - une erreur Postgres (ex. colonne manquante si une migration n'a pas
//     été exécutée) => null, mais l'erreur est renvoyée séparément pour être
//     logguée par l'appelant plutôt qu'avalée silencieusement.

export type Role = 'lecture' | 'edition' | 'admin';

export interface SupabaseLike {
    from(table: string): {
        select(columns: string): {
            eq(column: string, value: string): any;
        };
    };
}

export interface RoleResolution {
    role: Role | null;
    error: string | null;
}

export async function getUserRoleForBoard(
    supabase: SupabaseLike,
    roomId: string,
    userId: string
): Promise<RoleResolution> {
    const { data: board, error: boardError } = await supabase
        .from('tableaux')
        .select('owner_id')
        .eq('id', roomId)
        .maybeSingle();

    if (boardError) {
        return { role: null, error: boardError.message };
    }
    if (!board) {
        return { role: null, error: null };
    }
    if (board.owner_id === userId) {
        return { role: 'admin', error: null };
    }

    const { data: membre, error: membreError } = await supabase
        .from('tableau_membres')
        .select('role')
        .eq('tableau_id', roomId)
        .eq('user_id', userId)
        .eq('statut', 'acceptee')
        .maybeSingle();

    if (membreError) {
        return { role: null, error: membreError.message };
    }

    const role = (membre?.role as Role | undefined) ?? null;
    return { role, error: null };
}
