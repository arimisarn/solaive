'use client';

import { useMemo, useRef, useState } from 'react';
import type { Participant } from '@/hooks/use-tableau-comments';

export function MentionInput({
    value,
    onChange,
    participants,
    placeholder,
    maxLength,
    rows = 2,
    onSubmit,
    autoFocus,
}: {
    value: string;
    onChange: (v: string) => void;
    participants: Participant[];
    placeholder?: string;
    maxLength: number;
    rows?: number;
    /** Entrée sans Shift envoie, sauf si le menu d'autocomplete est ouvert. */
    onSubmit?: () => void;
    autoFocus?: boolean;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStart, setMentionStart] = useState<number | null>(null);

    const suggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        const q = mentionQuery.toLowerCase();
        return participants.filter((p) => p.email.toLowerCase().includes(q)).slice(0, 5);
    }, [mentionQuery, participants]);

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const v = e.target.value;
        onChange(v);

        const caret = e.target.selectionStart ?? v.length;
        const uptoCaret = v.slice(0, caret);
        // Déclenche l'autocomplete sur un "@" précédé d'un espace ou en début de texte,
        // suivi d'aucun espace jusqu'au curseur.
        const match = uptoCaret.match(/(?:^|\s)@([^\s@]*)$/);

        if (match) {
            setMentionQuery(match[1]);
            setMentionStart(caret - match[1].length - 1);
        } else {
            setMentionQuery(null);
            setMentionStart(null);
        }
    }

    function insertMention(p: Participant) {
        if (mentionStart === null || !textareaRef.current) return;
        const caret = textareaRef.current.selectionStart ?? value.length;
        const before = value.slice(0, mentionStart);
        const after = value.slice(caret);
        const inserted = `@${p.email} `;
        const next = `${before}${inserted}${after}`;
        onChange(next);
        setMentionQuery(null);
        setMentionStart(null);

        requestAnimationFrame(() => {
            const pos = before.length + inserted.length;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(pos, pos);
        });
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (mentionQuery !== null && e.key === 'Escape') {
            setMentionQuery(null);
            setMentionStart(null);
            return;
        }
        if (mentionQuery !== null && suggestions.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) {
            e.preventDefault();
            insertMention(suggestions[0]);
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
            e.preventDefault();
            onSubmit?.();
        }
    }

    return (
        <div className="relative flex-1">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={rows}
                autoFocus={autoFocus}
                className="max-h-28 w-full resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent/50"
            />
            {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 z-10 mb-1 w-full overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg">
                    {suggestions.map((p) => (
                        <button
                            key={p.user_id}
                            type="button"
                            onMouseDown={(e) => {
                                // onMouseDown (pas onClick) pour insérer avant que le textarea ne perde le focus.
                                e.preventDefault();
                                insertMention(p);
                            }}
                            className="block w-full truncate px-2.5 py-1.5 text-left text-sm text-foreground/80 hover:bg-accent/10 hover:text-accent"
                        >
                            @{p.email}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
