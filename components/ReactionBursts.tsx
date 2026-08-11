'use client';

import { track, type Editor } from 'tldraw';
import type { ReactionBurst } from '@/hooks/use-reactions';

/**
 * `track()` : re-render automatique au pan/zoom, même principe que
 * CommentPins. Chaque burst est positionné en coordonnées page puis converti
 * à l'écran via la caméra courante, donc il suit le canvas s'il bouge pendant
 * l'animation.
 */
export const ReactionBursts = track(function ReactionBursts({
    editor,
    bursts,
}: {
    editor: Editor | null;
    bursts: ReactionBurst[];
}) {
    if (!editor) return null;

    return (
        <>
            {bursts.map((b) => {
                const screenPoint = editor.pageToScreen({ x: b.x, y: b.y });
                return (
                    <div
                        key={b.id}
                        style={{ left: screenPoint.x, top: screenPoint.y }}
                        className="pointer-events-none fixed z-[320] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center animate-reaction-float"
                    >
                        <span className="text-3xl leading-none drop-shadow-sm">{b.emoji}</span>
                        <span className="mt-1 whitespace-nowrap rounded-full border border-border/60 bg-card/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground/70 shadow-sm backdrop-blur-sm">
                            {b.userName}
                        </span>
                    </div>
                );
            })}
        </>
    );
});
