import { describe, expect, it } from 'vitest';
import { getUserRoleForBoard, type SupabaseLike } from '../access-control';

// Faux client Supabase minimal : couvre juste la chaîne .from().select().eq()
// utilisée par getUserRoleForBoard, avec un résultat configurable par appel.
// L'ordre des appels correspond à l'ordre des requêtes dans le code testé :
// 1) tableaux (owner_id), 2) tableau_membres (role) — seulement si nécessaire.
function fakeSupabase(responses: Array<{ data: any; error: { message: string } | null }>): SupabaseLike {
    let call = 0;
    return {
        from() {
            return {
                select() {
                    return {
                        eq() {
                            return this;
                        },
                        // maybeSingle() est appelé en dernier dans la vraie chaîne ;
                        // ici .eq() renvoie `this` à chaque fois et l'objet est
                        // "thenable" faute de mieux — on expose maybeSingle
                        // directement pour rester simple et lisible.
                        maybeSingle: async () => responses[call++],
                    };
                },
            };
        },
    };
}

describe('getUserRoleForBoard', () => {
    it("renvoie 'admin' quand l'utilisateur est le owner du tableau", async () => {
        const supabase = fakeSupabase([{ data: { owner_id: 'user-1' }, error: null }]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'user-1');
        expect(result).toEqual({ role: 'admin', error: null });
    });

    it("renvoie null (pas d'erreur) quand le tableau n'existe pas", async () => {
        const supabase = fakeSupabase([{ data: null, error: null }]);
        const result = await getUserRoleForBoard(supabase, 'board-inconnu', 'user-1');
        expect(result).toEqual({ role: null, error: null });
    });

    it("renvoie le rôle stocké sur tableau_membres pour un collaborateur accepté", async () => {
        const supabase = fakeSupabase([
            { data: { owner_id: 'owner-id' }, error: null },
            { data: { role: 'edition' }, error: null },
        ]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'invite-1');
        expect(result).toEqual({ role: 'edition', error: null });
    });

    it("renvoie null quand l'utilisateur n'est ni owner ni membre accepté", async () => {
        const supabase = fakeSupabase([
            { data: { owner_id: 'owner-id' }, error: null },
            { data: null, error: null },
        ]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'inconnu-1');
        expect(result).toEqual({ role: null, error: null });
    });

    it("respecte le rôle 'lecture' pour un collaborateur en lecture seule", async () => {
        const supabase = fakeSupabase([
            { data: { owner_id: 'owner-id' }, error: null },
            { data: { role: 'lecture' }, error: null },
        ]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'invite-2');
        expect(result).toEqual({ role: 'lecture', error: null });
    });

    it('remonte l\'erreur Postgres au lieu de l\'avaler silencieusement (ex. colonne "role" manquante)', async () => {
        const supabase = fakeSupabase([
            { data: { owner_id: 'owner-id' }, error: null },
            { data: null, error: { message: 'column "role" does not exist' } },
        ]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'invite-3');
        expect(result.role).toBeNull();
        expect(result.error).toBe('column "role" does not exist');
    });

    it("s'arrête dès l'erreur sur la requête du tableau, sans faire la deuxième requête", async () => {
        const supabase = fakeSupabase([{ data: null, error: { message: 'network error' } }]);
        const result = await getUserRoleForBoard(supabase, 'board-1', 'user-1');
        expect(result).toEqual({ role: null, error: 'network error' });
    });
});
