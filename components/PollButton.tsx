'use client';

import { useState } from 'react';
import { BarChart3, Plus, X, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTableauSondage } from '@/hooks/use-tableau-sondage';

export function PollButton({ tableauId, userId, isOwner }: { tableauId: string; userId: string; isOwner: boolean }) {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const { poll, loading, myVote, tally, totalVotes, create, vote, removeVote, close, remove } = useTableauSondage({
        tableauId,
        userId,
    });

    const hasActivePoll = !!poll && !poll.termine;
    const canManage = !!poll && (poll.cree_par === userId || isOwner);

    function updateOption(index: number, value: string) {
        setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
    }

    function addOption() {
        if (options.length >= 6) return;
        setOptions((prev) => [...prev, '']);
    }

    function removeOption(index: number) {
        if (options.length <= 2) return;
        setOptions((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleCreate() {
        const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
        if (!question.trim() || cleanOptions.length < 2) {
            toast.error('Une question et au moins 2 options sont nécessaires.');
            return;
        }
        const res = await create(question.trim(), cleanOptions);
        if (res.error) {
            toast.error("Le sondage n'a pas pu être lancé.");
            return;
        }
        setQuestion('');
        setOptions(['', '']);
    }

    async function handleVote(optionId: string) {
        const res = optionId === myVote ? await removeVote() : await vote(optionId);
        if (res.error) toast.error('Vote impossible.');
    }

    async function handleClose() {
        const res = await close();
        if (res.error) toast.error('Impossible de clôturer.');
    }

    async function handleRemove() {
        const res = await remove();
        if (res.error) toast.error('Impossible de supprimer.');
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Vote / sondage"
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 shadow-sm backdrop-blur-sm transition-colors ${hasActivePoll
                            ? 'border-accent/40 bg-card/90 text-accent'
                            : 'w-9 justify-center border-border/60 bg-card/90 text-foreground/60 hover:border-accent/40 hover:text-accent'
                        }`}
                >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    {hasActivePoll && (
                        <span className="font-mono text-xs font-medium tabular-nums">{totalVotes}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="z-[310] w-72 rounded-xl border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-sm"
            >
                {loading ? (
                    <p className="py-2 text-center text-xs text-foreground/50">Chargement…</p>
                ) : !poll ? (
                    <div className="flex flex-col gap-2.5">
                        <span className="text-[11px] font-medium text-foreground/50">Lancer un sondage</span>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Question"
                            className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-accent/50"
                        />
                        <div className="flex flex-col gap-1.5">
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-accent/50"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(i)}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/40 hover:text-red-500"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 6 && (
                            <button
                                type="button"
                                onClick={addOption}
                                className="flex items-center gap-1 self-start text-xs font-medium text-foreground/50 hover:text-accent"
                            >
                                <Plus className="h-3.5 w-3.5" /> Ajouter une option
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="h-8 shrink-0 rounded-lg bg-accent px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
                        >
                            Lancer le sondage
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{poll.question}</span>
                            {poll.termine && (
                                <span className="flex shrink-0 items-center gap-1 rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-foreground/50">
                                    <Lock className="h-3 w-3" /> Clos
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {poll.options.map((opt) => {
                                const count = tally[opt.id] ?? 0;
                                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                const selected = myVote === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={poll.termine}
                                        onClick={() => handleVote(opt.id)}
                                        className={`relative overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-default ${selected ? 'border-accent/50' : 'border-border/60'
                                            }`}
                                    >
                                        <span
                                            className="absolute inset-y-0 left-0 bg-accent/10 transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                        <span className="relative flex items-center justify-between gap-2">
                                            <span className={`font-medium ${selected ? 'text-accent' : 'text-foreground'}`}>
                                                {opt.texte}
                                            </span>
                                            <span className="shrink-0 text-foreground/50">
                                                {count} · {pct}%
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <span className="text-[11px] text-foreground/40">
                            {totalVotes} vote{totalVotes > 1 ? 's' : ''}
                            {!poll.termine && myVote ? ' · touche à nouveau pour retirer ton vote' : ''}
                        </span>
                        {canManage && (
                            <div className="flex items-center gap-1.5 border-t border-border/60 pt-2.5">
                                {!poll.termine && (
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-3 text-xs font-medium text-foreground/70 hover:border-accent/40 hover:text-accent"
                                    >
                                        <Lock className="h-3.5 w-3.5" /> Clôturer
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-3 text-xs font-medium text-foreground/70 hover:border-red-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}