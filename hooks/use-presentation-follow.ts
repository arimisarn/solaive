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
export function usePresentationFollow({
    editor,
    presentateurId,
    currentUserId,
}: {
    editor: Editor | null;
    presentateurId: string | null;
    currentUserId: string;
}) {
    useEffect(() => {
        if (!editor) return;

        if (presentateurId && presentateurId !== currentUserId) {
            // Cast défensif : selon les versions de tldraw, TLUserId est un
            // type "branded" plus strict qu'un simple string.
            editor.startFollowingUser(presentateurId as any);
            editor.updateInstanceState({ isReadonly: true });
        } else {
            if (editor.getInstanceState().followingUserId) {
                editor.stopFollowingUser();
            }
            editor.updateInstanceState({ isReadonly: false });
        }
    }, [editor, presentateurId, currentUserId]);
}
