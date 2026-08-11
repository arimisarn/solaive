'use client';

import { useEffect } from 'react';
import type { Editor } from 'tldraw';

/**
 * Traduit l'état "présentation" partagé en comportement tldraw :
 * - un spectateur (presentateurId défini, différent de soi) suit
 *   automatiquement la caméra du présentateur via l'API native
 *   `startFollowingUser`, et le tableau passe en lecture seule pour lui ;
 * - le présentateur, et tout le monde quand la présentation s'arrête,
 *   repassent en édition normale et ne suivent personne.
 *
 * Le suivi de caméra lui-même (positions synchronisées) est déjà géré par
 * @tldraw/sync via la présence de chaque utilisateur — startFollowingUser
 * se contente de dire "aligne ma caméra sur la sienne", tldraw fait le reste
 * (et un pan/zoom manuel du spectateur interrompt le suivi de lui-même,
 * comportement natif du SDK).
 */
/**
 * Traduit l'état "présentation" partagé en comportement tldraw :
 * - un spectateur (presentateurId défini, différent de soi) suit
 *   automatiquement la caméra du présentateur via l'API native
 *   `startFollowingUser`, et le tableau passe en lecture seule pour lui ;
 * - le présentateur, et tout le monde quand la présentation s'arrête,
 *   arrêtent de suivre et repassent en lecture seule normale — c'est-à-dire
 *   le mode déterminé par `readonlyFromRole` (le rôle lecture/édition/admin),
 *   PAS forcément en édition : sinon un membre en rôle "lecture" repasserait
 *   en édition dès la fin d'une présentation. Ce hook ne fait qu'AJOUTER une
 *   contrainte de lecture seule, jamais la retirer par rapport au rôle.
 *
 * Le suivi de caméra lui-même (positions synchronisées) est déjà géré par
 * @tldraw/sync via la présence de chaque utilisateur — startFollowingUser
 * se contente de dire "aligne ma caméra sur la sienne", tldraw fait le reste
 * (et un pan/zoom manuel du spectateur interrompt le suivi de lui-même,
 * comportement natif du SDK).
 */
export function usePresentationFollow({
    editor,
    presentateurId,
    currentUserId,
    readonlyFromRole = false,
}: {
    editor: Editor | null;
    presentateurId: string | null;
    currentUserId: string;
    /** true si le rôle de l'utilisateur (lecture seule) impose déjà l'édition bloquée, indépendamment de toute présentation. */
    readonlyFromRole?: boolean;
}) {
    useEffect(() => {
        if (!editor) return;

        const isSpectator = !!presentateurId && presentateurId !== currentUserId;

        if (isSpectator) {
            // Cast défensif : selon les versions de tldraw, TLUserId est un
            // type "branded" plus strict qu'un simple string.
            editor.startFollowingUser(presentateurId as any);
        } else if (editor.getInstanceState().followingUserId) {
            editor.stopFollowingUser();
        }

        editor.updateInstanceState({ isReadonly: isSpectator || readonlyFromRole });
    }, [editor, presentateurId, currentUserId, readonlyFromRole]);
}