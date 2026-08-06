'use client';

import { useState } from 'react';
import { Loader2, Users, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Collaborateur = {
    user_id: string;
    email: string;
    created_at: string;
};

export function ShareDialog({
    tableauId,
    trigger,
}: {
    tableauId: string;
    trigger?: React.ReactNode;
}) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);

    async function loadCollaborateurs() {
        setLoading(true);
        const { data, error } = await supabase.rpc('lister_collaborateurs', {
            p_tableau_id: tableauId,
        });

        if (error) {
            toast.error("Impossible de charger les collaborateurs.");
        } else {
            setCollaborateurs(data ?? []);
        }
        setLoading(false);
    }

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (next) loadCollaborateurs();
    }

    async function handleInvite() {
        if (!email.trim()) return;
        setInviting(true);

        const { error } = await supabase.rpc('inviter_collaborateur', {
            p_tableau_id: tableauId,
            p_email: email.trim(),
        });

        setInviting(false);

        if (error) {
            toast.error(error.message || "Impossible d'inviter cette personne.");
            return;
        }

        toast.success(`${email.trim()} a été ajouté au tableau.`);
        setEmail('');
        loadCollaborateurs();
    }

    async function handleRemove(userId: string) {
        setRemovingId(userId);

        const { error } = await supabase.rpc('retirer_collaborateur', {
            p_tableau_id: tableauId,
            p_user_id: userId,
        });

        setRemovingId(null);

        if (error) {
            toast.error("Impossible de retirer ce collaborateur.");
            return;
        }

        setCollaborateurs((prev) => prev.filter((c) => c.user_id !== userId));
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:text-accent"
                    >
                        <Users className="h-4 w-4" />
                        Partager
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-heading">Partager le tableau</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleInvite();
                        }}
                        placeholder="email@exemple.com"
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/50"
                    />
                    <button
                        type="button"
                        onClick={handleInvite}
                        disabled={inviting || !email.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        Inviter
                    </button>
                </div>

                <div className="mt-2">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
                        Collaborateurs
                    </p>

                    {loading ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-foreground/60">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement…
                        </div>
                    ) : collaborateurs.length === 0 ? (
                        <p className="py-4 text-sm text-foreground/50">
                            Personne d&apos;autre n&apos;a encore accès à ce tableau.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {collaborateurs.map((c) => (
                                <li
                                    key={c.user_id}
                                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                                >
                                    <span className="truncate text-foreground/80">{c.email}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(c.user_id)}
                                        disabled={removingId === c.user_id}
                                        className="text-foreground/40 hover:text-red-500 disabled:opacity-50"
                                        aria-label={`Retirer ${c.email}`}
                                    >
                                        {removingId === c.user_id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <X className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}