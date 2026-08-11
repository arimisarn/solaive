'use client';

import { useState } from 'react';
import { Check, RotateCcw, Trash2, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { MentionInput } from './MentionInput';
import { CommentText } from './CommentText';
import { extractMentions } from '@/lib/mentions';
import { COMMENT_MAX_LENGTH, type Commentaire, type Participant } from '@/hooks/use-tableau-comments';

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function CommentThread({
    root,
    replies,
    participants,
    currentUserId,
    position,
    onClose,
    onReply,
    onToggleResolved,
    onDelete,
}: {
    root: Commentaire;
    replies: Commentaire[];
    participants: Participant[];
    currentUserId: string;
    position: { left: number; top: number };
    onClose: () => void;
    onReply: (contenu: string, mentions: string[]) => Promise<{ error: string | null }>;
    onToggleResolved: (resolu: boolean) => void;
    onDelete: (id: string) => void;
}) {
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    async function handleSubmitReply() {
        if (!replyText.trim() || sending) return;
        setSending(true);
        const mentions = extractMentions(replyText, participants);
        const res = await onReply(replyText, mentions);
        setSending(false);
        if (res.error) {
            toast.error("La réponse n'a pas pu être envoyée.");
            return;
        }
        setReplyText('');
    }

    const thread = [root, ...replies];

    return (
        <div
            style={{ left: position.left, top: position.top }}
            className="pointer-events-auto fixed z-[310] flex max-h-[420px] w-72 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-lg backdrop-blur-sm"
        >
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <span className={`text-[11px] font-medium ${root.resolu ? 'text-emerald-600' : 'text-foreground/50'}`}>
                    {root.resolu ? 'Résolu' : 'Commentaire'}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onToggleResolved(!root.resolu)}
                        title={root.resolu ? 'Rouvrir le fil' : 'Marquer comme résolu'}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/40 transition-colors hover:text-accent"
                    >
                        {root.resolu ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-foreground/40 hover:text-foreground/70"
                        aria-label="Fermer le fil"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
                {thread.map((c) => (
                    <div key={c.id} className="group">
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-medium text-foreground/60">
                                {c.user_id === currentUserId ? 'Toi' : c.auteur_nom}
                            </span>
                            <div className="flex shrink-0 items-center gap-1.5">
                                <span className="text-[10px] text-foreground/35">{formatDate(c.created_at)}</span>
                                {c.user_id === currentUserId && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(c.id)}
                                        className="hidden text-foreground/30 hover:text-red-500 group-hover:inline"
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                            <CommentText contenu={c.contenu} participants={participants} />
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex items-end gap-2 border-t border-border/60 p-2">
                <MentionInput
                    value={replyText}
                    onChange={setReplyText}
                    participants={participants}
                    placeholder="Répondre… (@ pour mentionner)"
                    maxLength={COMMENT_MAX_LENGTH}
                    onSubmit={handleSubmitReply}
                />
                <button
                    type="button"
                    onClick={handleSubmitReply}
                    disabled={sending || !replyText.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    aria-label="Envoyer la réponse"
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
}
