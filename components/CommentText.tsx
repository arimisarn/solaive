import { escapeRegExp } from '@/lib/mentions';
import type { Participant } from '@/hooks/use-tableau-comments';

export function CommentText({ contenu, participants }: { contenu: string; participants: Participant[] }) {
    if (participants.length === 0) return <>{contenu}</>;

    // Les emails les plus longs d'abord, pour éviter qu'un email préfixe d'un
    // autre ne coupe le match trop tôt.
    const emails = [...participants.map((p) => p.email)].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`@(${emails.map(escapeRegExp).join('|')})`, 'g');
    const parts = contenu.split(pattern);

    return (
        <>
            {parts.map((part, i) =>
                emails.includes(part) ? (
                    <span key={i} className="font-medium text-accent">
                        @{part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}
