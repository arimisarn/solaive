'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';

type Message = {
    id: string;
    user_id: string;
    auteur_nom: string;
    contenu: string;
    created_at: string;
};

const MAX_LENGTH = 2000;

export function ChatPanel({
    tableauId,
    userId,
    userName,
}: {
    tableauId: string;
    userId: string;
    userName: string;
}) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const openRef = useRef(open);
    openRef.current = open;

    // Chargement de l'historique + abonnement realtime, une seule fois par tableau.
    useEffect(() => {
        let cancelled = false;

        async function loadHistory() {
            setLoading(true);
            const { data, error } = await supabase
                .from('tableau_messages')
                .select('id, user_id, auteur_nom, contenu, created_at')
                .eq('tableau_id', tableauId)
                .order('created_at', { ascending: true })
                .limit(200);

            if (cancelled) return;

            if (error) {
                toast.error("Impossible de charger le chat.");
            } else {
                setMessages(data ?? []);
            }
            setLoading(false);
        }

        loadHistory();

        const channel = supabase
            .channel(`tableau_messages:${tableauId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tableau_messages',
                    filter: `tableau_id=eq.${tableauId}`,
                },
                (payload) => {
                    const nouveauMessage = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === nouveauMessage.id)) return prev;
                        return [...prev, nouveauMessage];
                    });

                    if (!openRef.current && nouveauMessage.user_id !== userId) {
                        setUnreadCount((prev) => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableauId]);

    // Auto-scroll vers le bas à chaque nouveau message ou à l'ouverture.
    useEffect(() => {
        if (!open) return;
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, open]);

    function handleToggle() {
        setOpen((prev) => !prev);
        setUnreadCount(0);
    }

    async function handleSend() {
        const contenu = input.trim();
        if (!contenu || sending) return;

        if (contenu.length > MAX_LENGTH) {
            toast.error(`Message trop long (max ${MAX_LENGTH} caractères).`);
            return;
        }

        setSending(true);
        const { error } = await supabase.from('tableau_messages').insert({
            tableau_id: tableauId,
            user_id: userId,
            auteur_nom: userName,
            contenu,
        });
        setSending(false);

        if (error) {
            toast.error("Le message n'a pas pu être envoyé.");
            return;
        }

        setInput('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={handleToggle}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent"
                title="Chat"
            >
                <MessageCircle className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="pointer-events-auto fixed bottom-3 right-3 z-[300] flex h-[420px] w-80 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/95 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                        <p className="font-heading text-sm font-medium text-foreground">Chat</p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-foreground/40 hover:text-foreground/70"
                            aria-label="Fermer le chat"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
                        {loading ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-foreground/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Chargement…
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="py-4 text-center text-sm text-foreground/50">
                                Aucun message pour l&apos;instant.
                            </p>
                        ) : (
                            messages.map((m) => {
                                const isSelf = m.user_id === userId;
                                return (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                                    >
                                        <span className="mb-0.5 text-[11px] text-foreground/40">
                                            {isSelf ? 'Toi' : m.auteur_nom}
                                        </span>
                                        <div
                                            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-2.5 py-1.5 text-sm ${
                                                isSelf
                                                    ? 'bg-accent text-white'
                                                    : 'bg-background text-foreground/90 border border-border/60'
                                            }`}
                                        >
                                            {m.contenu}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex items-end gap-2 border-t border-border/60 p-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Écrire un message…"
                            rows={1}
                            maxLength={MAX_LENGTH}
                            className="max-h-24 flex-1 resize-none rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent/50"
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            aria-label="Envoyer"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
