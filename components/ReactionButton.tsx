'use client';

import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import type { Editor } from 'tldraw';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJIS = ['👍', '❤️', '🎉', '😂', '👏', '🤔'];

export function ReactionButton({
    editor,
    onReact,
}: {
    editor: Editor | null;
    onReact: (emoji: string, x: number, y: number) => void;
}) {
    const [open, setOpen] = useState(false);

    function handlePick(emoji: string) {
        if (!editor) return;
        // Le burst part du centre du viewport courant, en coordonnées page
        // (donc ancré au canvas, pas à l'écran) avec un léger tirage aléatoire
        // pour que des réactions rapprochées ne se superposent pas exactement.
        const bounds = editor.getViewportPageBounds();
        const jitter = (spread: number) => (Math.random() - 0.5) * spread;
        onReact(emoji, bounds.midX + jitter(bounds.width * 0.2), bounds.midY + jitter(bounds.height * 0.2));
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Envoyer une réaction"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
                >
                    <SmilePlus className="h-4 w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="z-[310] flex w-auto gap-1 rounded-xl border-border/60 bg-card/95 p-1.5 shadow-lg backdrop-blur-sm"
            >
                {EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => handlePick(emoji)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-secondary"
                    >
                        {emoji}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
