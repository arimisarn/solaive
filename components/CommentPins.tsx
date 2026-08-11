'use client';

import { useState } from 'react';
import { track, type Editor } from 'tldraw';
import { MessageSquare, MessageSquarePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { MentionInput } from './MentionInput';
import { CommentThread } from './CommentThread';
import { extractMentions } from '@/lib/mentions';
import { COMMENT_MAX_LENGTH, type Commentaire, type Participant } from '@/hooks/use-tableau-comments';

type Draft = { x: number; y: number; shapeId: string | null; screenLeft: number; screenTop: number };

const PANEL_WIDTH = 288; // w-72
const PANEL_MARGIN = 12;

function clampLeft(left: number) {
    if (typeof window === 'undefined') return left;
    return Math.min(Math.max(left, PANEL_MARGIN), window.innerWidth - PANEL_WIDTH - PANEL_MARGIN);
}

function clampTop(top: number, height = 260) {
    if (typeof window === 'undefined') return top;
    return Math.min(Math.max(top, PANEL_MARGIN), window.innerHeight - height - PANEL_MARGIN);
}

/**
 * `track()` rend ce composant réactif aux signaux tldraw lus pendant son
 * rendu (caméra, formes...) : pas besoin d'écouter manuellement le pan/zoom,
 * il se re-render automatiquement quand la caméra bouge.
 */
export const CommentPins = track(function CommentPins({
    editor,
    comments,
    participants,
    currentUserId,
    placing,
    onPlacingChange,
    activeThreadId,
    onOpenThread,
    onCreateRoot,
    onReply,
    onToggleResolved,
    onDelete,
    showResolved,
}: {
    editor: Editor | null;
    comments: Commentaire[];
    participants: Participant[];
    currentUserId: string;
    placing: boolean;
    onPlacingChange: (placing: boolean) => void;
    activeThreadId: string | null;
    onOpenThread: (id: string | null) => void;
    onCreateRoot: (opts: {
        contenu: string;
        mentions: string[];
        shapeId: string | null;
        x: number;
        y: number;
    }) => Promise<{ error: string | null; comment?: Commentaire }>;
    onReply: (parentId: string, contenu: string, mentions: string[]) => Promise<{ error: string | null }>;
    onToggleResolved: (id: string, resolu: boolean) => void;
    onDelete: (id: string) => void;
    showResolved: boolean;
}) {
    const [draft, setDraft] = useState<Draft | null>(null);
    const [draftText, setDraftText] = useState('');
    const [sendingDraft, setSendingDraft] = useState(false);

    const roots = comments.filter((c) => c.parent_id === null && (showResolved || !c.resolu));
    const repliesFor = (rootId: string) => comments.filter((c) => c.parent_id === rootId);

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (!editor) return;
        // screenToPage attend des coordonnées écran "brutes" (clientX/clientY),
        // pas relatives à un conteneur : c'est ce que fournit directement l'event.
        const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
        const hitShape = editor.getShapeAtPoint(pagePoint, { hitInside: true, margin: 8 });

        setDraft({
            x: pagePoint.x,
            y: pagePoint.y,
            shapeId: hitShape ? hitShape.id : null,
            screenLeft: e.clientX,
            screenTop: e.clientY,
        });
        onOpenThread(null);
        onPlacingChange(false);
    }

    async function submitDraft() {
        if (!draft || !draftText.trim() || sendingDraft) return;
        setSendingDraft(true);
        const mentions = extractMentions(draftText, participants);
        const res = await onCreateRoot({
            contenu: draftText,
            mentions,
            shapeId: draft.shapeId,
            x: draft.x,
            y: draft.y,
        });
        setSendingDraft(false);
        if (res.error) {
            toast.error("Le commentaire n'a pas pu être publié.");
            return;
        }
        setDraft(null);
        setDraftText('');
        if (res.comment) onOpenThread(res.comment.id);
    }

    function anchorScreenPoint(c: Commentaire) {
        const bounds = c.shape_id ? editor?.getShapePageBounds(c.shape_id) : null;
        const pagePoint = bounds ? { x: bounds.x, y: bounds.y } : { x: c.x, y: c.y };
        return editor!.pageToScreen(pagePoint);
    }

    const activeRoot = activeThreadId ? comments.find((c) => c.id === activeThreadId && c.parent_id === null) : null;

    return (
        <>
            {/* Bouton flottant pour démarrer/annuler le placement d'un pin, visible dès qu'on a un editor. */}
            {editor && (
                <button
                    type="button"
                    onClick={() => {
                        onPlacingChange(!placing);
                        if (!placing) onOpenThread(null);
                    }}
                    title={placing ? 'Annuler le placement' : 'Ajouter un commentaire sur le tableau'}
                    className={`pointer-events-auto fixed bottom-3 left-3 z-[300] flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm backdrop-blur-sm transition-colors ${
                        placing
                            ? 'border-accent bg-accent text-white'
                            : 'border-border/60 bg-card/90 text-foreground/60 hover:border-accent/40 hover:text-accent'
                    }`}
                >
                    {placing ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
                </button>
            )}

            {/* Capture layer : intercepte le prochain clic sur le canvas pendant le placement. */}
            {placing && (
                <div className="fixed inset-0 z-[290] cursor-crosshair" onClick={handleOverlayClick} />
            )}

            {/* Pins existants */}
            {editor &&
                roots.map((c) => {
                    const screenPoint = anchorScreenPoint(c);
                    const replyCount = repliesFor(c.id).length;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => onOpenThread(activeThreadId === c.id ? null : c.id)}
                            style={{ left: screenPoint.x, top: screenPoint.y }}
                            className={`pointer-events-auto fixed z-[300] flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border px-1.5 py-1 text-[10px] font-medium shadow-sm transition-transform hover:scale-105 ${
                                c.resolu
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : 'border-accent/40 bg-accent text-white'
                            }`}
                        >
                            <MessageSquare className="h-3 w-3" />
                            {replyCount > 0 && <span>{replyCount + 1}</span>}
                        </button>
                    );
                })}

            {/* Fil ouvert */}
            {editor && activeRoot && (
                <CommentThread
                    root={activeRoot}
                    replies={repliesFor(activeRoot.id)}
                    participants={participants}
                    currentUserId={currentUserId}
                    position={(() => {
                        const p = anchorScreenPoint(activeRoot);
                        return { left: clampLeft(p.x + 12), top: clampTop(p.y + 12) };
                    })()}
                    onClose={() => onOpenThread(null)}
                    onReply={(contenu, mentions) => onReply(activeRoot.id, contenu, mentions)}
                    onToggleResolved={(resolu) => onToggleResolved(activeRoot.id, resolu)}
                    onDelete={onDelete}
                />
            )}

            {/* Composeur du nouveau pin */}
            {draft && (
                <div
                    style={{
                        left: clampLeft(draft.screenLeft + 8),
                        top: clampTop(draft.screenTop + 8, 160),
                    }}
                    className="pointer-events-auto fixed z-[310] flex w-72 flex-col gap-2 rounded-xl border border-border/60 bg-card/95 p-2.5 shadow-lg backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground/50">Nouveau commentaire</span>
                        <button
                            type="button"
                            onClick={() => {
                                setDraft(null);
                                setDraftText('');
                            }}
                            className="text-foreground/40 hover:text-foreground/70"
                            aria-label="Annuler"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <MentionInput
                        value={draftText}
                        onChange={setDraftText}
                        participants={participants}
                        placeholder="Écrire un commentaire… (@ pour mentionner)"
                        maxLength={COMMENT_MAX_LENGTH}
                        autoFocus
                        onSubmit={submitDraft}
                    />
                    <button
                        type="button"
                        onClick={submitDraft}
                        disabled={sendingDraft || !draftText.trim()}
                        className="self-end rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {sendingDraft ? 'Envoi…' : 'Publier'}
                    </button>
                </div>
            )}
        </>
    );
});
