'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/clients';

export type Commentaire = {
    id: string;
    tableau_id: string;
    parent_id: string | null;
    shape_id: string | null;
    x: number;
    y: number;
    user_id: string;
    auteur_nom: string;
    contenu: string;
    mentions: string[];
    resolu: boolean;
    created_at: string;
};

export type Participant = { user_id: string; email: string };

export const COMMENT_MAX_LENGTH = 1000;

type MutationResult = { error: string | null; comment?: Commentaire };

export function useTableauComments({
    tableauId,
    userId,
    userName,
    isPanelOpen,
}: {
    tableauId: string;
    userId: string;
    userName: string;
    /** true si une UI de commentaires (panneau liste ou fil ouvert) est visible, pour le compteur de non-lus. */
    isPanelOpen: boolean;
}) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Commentaire[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const isPanelOpenRef = useRef(isPanelOpen);
    isPanelOpenRef.current = isPanelOpen;

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            const [{ data: rows, error }, { data: parts, error: partsError }] = await Promise.all([
                supabase
                    .from('tableau_commentaires')
                    .select('*')
                    .eq('tableau_id', tableauId)
                    .order('created_at', { ascending: true }),
                supabase.rpc('lister_participants_tableau', { p_tableau_id: tableauId }),
            ]);

            if (cancelled) return;

            if (error) console.error('Chargement commentaires:', error.message);
            else setComments((rows as Commentaire[]) ?? []);

            if (partsError) console.error('Chargement participants:', partsError.message);
            else setParticipants((parts as Participant[]) ?? []);

            setLoading(false);
        }

        load();

        const channel = supabase
            .channel(`tableau_commentaires:${tableauId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tableau_commentaires',
                    filter: `tableau_id=eq.${tableauId}`,
                },
                (payload) => {
                    const row = payload.new as Commentaire;
                    setComments((prev) => (prev.some((c) => c.id === row.id) ? prev : [...prev, row]));
                    if (!isPanelOpenRef.current && row.user_id !== userId) {
                        setUnreadCount((n) => n + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tableau_commentaires',
                    filter: `tableau_id=eq.${tableauId}`,
                },
                (payload) => {
                    const row = payload.new as Commentaire;
                    setComments((prev) => prev.map((c) => (c.id === row.id ? row : c)));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'tableau_commentaires',
                    filter: `tableau_id=eq.${tableauId}`,
                },
                (payload) => {
                    const oldRow = payload.old as { id: string };
                    setComments((prev) => prev.filter((c) => c.id !== oldRow.id && c.parent_id !== oldRow.id));
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableauId]);

    const clearUnread = useCallback(() => setUnreadCount(0), []);

    async function addComment(opts: {
        contenu: string;
        mentions: string[];
        shapeId: string | null;
        x: number;
        y: number;
    }): Promise<MutationResult> {
        const contenu = opts.contenu.trim();
        if (!contenu || contenu.length > COMMENT_MAX_LENGTH || !userId) return { error: 'invalide' };

        const { data, error } = await supabase
            .from('tableau_commentaires')
            .insert({
                tableau_id: tableauId,
                parent_id: null,
                shape_id: opts.shapeId,
                x: opts.x,
                y: opts.y,
                user_id: userId,
                auteur_nom: userName,
                contenu,
                mentions: opts.mentions,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        const comment = data as Commentaire;
        setComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
        return { error: null, comment };
    }

    async function addReply(opts: { parentId: string; contenu: string; mentions: string[] }): Promise<MutationResult> {
        const contenu = opts.contenu.trim();
        if (!contenu || contenu.length > COMMENT_MAX_LENGTH || !userId) return { error: 'invalide' };

        const parent = comments.find((c) => c.id === opts.parentId);
        if (!parent) return { error: 'Fil introuvable.' };

        const { data, error } = await supabase
            .from('tableau_commentaires')
            .insert({
                tableau_id: tableauId,
                parent_id: opts.parentId,
                shape_id: parent.shape_id,
                x: parent.x,
                y: parent.y,
                user_id: userId,
                auteur_nom: userName,
                contenu,
                mentions: opts.mentions,
            })
            .select()
            .single();

        if (error) return { error: error.message };
        const comment = data as Commentaire;
        setComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
        return { error: null, comment };
    }

    async function toggleResolved(rootId: string, resolu: boolean) {
        // Passe par une fonction SQL security definer plutôt qu'un UPDATE direct :
        // n'importe quel collaborateur ayant accès peut résoudre/rouvrir un fil,
        // mais ne doit pas pouvoir modifier le contenu des commentaires d'autrui
        // (RLS n'autorise que l'auteur en delete, pas d'update ouvert).
        const { error } = await supabase.rpc('basculer_resolution_commentaire', {
            p_commentaire_id: rootId,
            p_resolu: resolu,
        });
        if (!error) {
            setComments((prev) => prev.map((c) => (c.id === rootId ? { ...c, resolu } : c)));
        }
        return { error: error?.message ?? null };
    }

    async function deleteComment(id: string) {
        const { error } = await supabase.from('tableau_commentaires').delete().eq('id', id);
        if (!error) {
            setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
        }
        return { error: error?.message ?? null };
    }

    return {
        loading,
        comments,
        participants,
        unreadCount,
        clearUnread,
        addComment,
        addReply,
        toggleResolved,
        deleteComment,
    };
}
