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

type Role = 'lecture' | 'edition' | 'admin';

type Collaborateur = {
    user_id: string;
    email: string;
    created_at: string;
    statut: 'en_attente' | 'acceptee' | 'refusee';
    role: Role;
};

const STATUT_LABELS: Record<Collaborateur['statut'], { label: string; className: string }> = {
    en_attente: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
    acceptee: { label: 'Accepté', className: 'bg-emerald-100 text-emerald-700' },
    refusee: { label: 'Refusé', className: 'bg-red-100 text-red-600' },
};

const ROLE_LABELS: Record<Role, string> = {
    lecture: 'Lecture seule',
    edition: 'Édition',
    admin: 'Admin',
};

export function ShareDialog({
    tableauId,
    isOwner,
    trigger,
}: {
    tableauId: string;
    /** Seul le owner peut changer le rôle des collaborateurs (contrainte appliquée aussi côté SQL). */
    isOwner: boolean;
    trigger?: React.ReactNode;
}) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);

    async function loadCollaborateurs() {
        setLoading(true);
        const { data, error } = await supabase.rpc('lister_collaborateurs_avec_role', {
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

        toast.success(`Invitation envoyée à ${email.trim()}.`);
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

    async function handleRoleChange(userId: string, role: Role) {
        setUpdatingRoleId(userId);

        const { error } = await supabase.rpc('definir_role_collaborateur', {
            p_tableau_id: tableauId,
            p_user_id: userId,
            p_role: role,
        });

        setUpdatingRoleId(null);

        if (error) {
            toast.error(error.message || "Impossible de modifier ce rôle.");
            return;
        }

        setCollaborateurs((prev) => prev.map((c) => (c.user_id === userId ? { ...c, role } : c)));
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
                <p className="text-[11px] text-foreground/40">
                    Les nouvelles personnes invitées reçoivent le rôle « Édition » par défaut — ajustable ci-dessous une fois acceptée.
                </p>

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
                                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="truncate text-foreground/80">{c.email}</span>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_LABELS[c.statut].className}`}
                                        >
                                            {STATUT_LABELS[c.statut].label}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {isOwner ? (
                                            <select
                                                value={c.role}
                                                disabled={updatingRoleId === c.user_id}
                                                onChange={(e) => handleRoleChange(c.user_id, e.target.value as Role)}
                                                className="h-7 rounded-md border border-border/60 bg-background px-1.5 text-xs outline-none focus:border-accent/50 disabled:opacity-50"
                                            >
                                                {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                                                    <option key={r} value={r}>
                                                        {ROLE_LABELS[r]}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-xs text-foreground/50">{ROLE_LABELS[c.role]}</span>
                                        )}
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
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}