// lib/sondage-utils.ts
//
// Petites fonctions pures extraites de hooks/use-tableau-sondage.ts pour
// être testées isolément (pas de dépendance à React ni à Supabase).

export type SondageVote = {
    sondage_id: string;
    user_id: string;
    option_id: string;
};

/** Nombre de votes par option, à partir de la liste brute des votes. */
export function computeTally(votes: SondageVote[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const v of votes) counts[v.option_id] = (counts[v.option_id] ?? 0) + 1;
    return counts;
}

/** Vote de l'utilisateur courant (ou null s'il n'a pas encore voté). */
export function findMyVote(votes: SondageVote[], userId: string): string | null {
    return votes.find((v) => v.user_id === userId)?.option_id ?? null;
}

/**
 * Pourcentage d'une option, arrondi à l'entier le plus proche. 0 si aucun
 * vote au total (évite une division par zéro plutôt que de renvoyer NaN).
 */
export function computePercentage(optionCount: number, totalVotes: number): number {
    if (totalVotes === 0) return 0;
    return Math.round((optionCount / totalVotes) * 100);
}
