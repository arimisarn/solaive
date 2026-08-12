/**
 * Formatte une date en "il y a ..." relatif au moment présent.
 * Extrait en fonction pure (comme lib/sondage-utils.ts) pour être testable
 * sans dépendre de l'horloge système au moment du rendu React.
 */
export function formatActiviteRelative(dateStr: string | null, now: Date = new Date()): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);

    if (diffSec < 60) return "à l'instant";

    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `il y a ${diffMin} min`;

    const diffHeures = Math.round(diffMin / 60);
    if (diffHeures < 24) return `il y a ${diffHeures} h`;

    const diffJours = Math.round(diffHeures / 24);
    if (diffJours === 1) return 'hier';
    if (diffJours < 7) return `il y a ${diffJours} j`;

    const diffSemaines = Math.round(diffJours / 7);
    if (diffSemaines < 5) return `il y a ${diffSemaines} sem.`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
