'use client';

import { useState } from 'react';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTableauTimer } from '@/hooks/use-tableau-timer';

const PRESETS_MINUTES = [1, 3, 5, 10, 15];

function formatTime(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TimerButton({ tableauId }: { tableauId: string }) {
    const [open, setOpen] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const { remaining, running, paused, start, pause, resume, reset } = useTableauTimer({ tableauId });

    const isIdle = !running && !paused;
    const urgent = running && remaining <= 10;

    async function handleStart(minutes: number) {
        if (!minutes || minutes <= 0) return;
        const res = await start(Math.round(minutes * 60));
        if (res.error) {
            toast.error("Le minuteur n'a pas pu démarrer.");
            return;
        }
        setCustomMinutes('');
    }

    async function handlePause() {
        const res = await pause();
        if (res.error) toast.error('Impossible de mettre en pause.');
    }

    async function handleResume() {
        const res = await resume();
        if (res.error) toast.error('Impossible de reprendre.');
    }

    async function handleReset() {
        const res = await reset();
        if (res.error) toast.error('Impossible de réinitialiser.');
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    title="Minuteur partagé"
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-2.5 shadow-sm backdrop-blur-sm transition-colors ${isIdle
                            ? 'w-9 justify-center border-border/60 bg-card/90 text-foreground/60 hover:border-accent/40 hover:text-accent'
                            : urgent
                                ? 'border-red-400 bg-red-50 text-red-600'
                                : 'border-accent/40 bg-card/90 text-accent'
                        }`}
                >
                    <Timer className="h-4 w-4 shrink-0" />
                    {!isIdle && (
                        <span className="font-mono text-xs font-medium tabular-nums">{formatTime(remaining)}</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="z-[310] w-64 rounded-xl border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-sm"
            >
                {isIdle ? (
                    <div className="flex flex-col gap-2.5">
                        <span className="text-[11px] font-medium text-foreground/50">Démarrer un minuteur</span>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESETS_MINUTES.map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => handleStart(min)}
                                    className="rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min={1}
                                max={180}
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(e.target.value)}
                                placeholder="Minutes"
                                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-accent/50"
                            />
                            <button
                                type="button"
                                onClick={() => handleStart(Number(customMinutes))}
                                disabled={!customMinutes || Number(customMinutes) <= 0}
                                className="h-8 shrink-0 rounded-lg bg-accent px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                Démarrer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2.5">
                        <span className={`font-mono text-3xl font-semibold tabular-nums ${urgent ? 'text-red-600' : 'text-foreground'}`}>
                            {formatTime(remaining)}
                        </span>
                        <div className="flex items-center gap-1.5">
                            {running ? (
                                <button
                                    type="button"
                                    onClick={handlePause}
                                    className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-3 text-xs font-medium text-foreground/70 hover:border-accent/40 hover:text-accent"
                                >
                                    <Pause className="h-3.5 w-3.5" /> Pause
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResume}
                                    className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-3 text-xs font-medium text-foreground/70 hover:border-accent/40 hover:text-accent"
                                >
                                    <Play className="h-3.5 w-3.5" /> Reprendre
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex h-8 items-center gap-1 rounded-lg border border-border/60 px-3 text-xs font-medium text-foreground/70 hover:border-red-400 hover:text-red-600"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
                            </button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}