import type { Participant } from '@/hooks/use-tableau-comments';

/**
 * Extrait les user_id mentionnés dans un texte, en repérant les occurrences
 * "@email" correspondant à un participant connu du tableau (owner + membres
 * acceptés). On matche sur l'email complet (inséré tel quel par MentionInput
 * au moment de la sélection dans l'autocomplete), pas sur un id caché.
 */
export function extractMentions(contenu: string, participants: Participant[]): string[] {
    const found = new Set<string>();
    for (const p of participants) {
        if (contenu.includes(`@${p.email}`)) found.add(p.user_id);
    }
    return Array.from(found);
}

export function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}