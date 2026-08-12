'use client';

import { useEffect, useRef, useState } from 'react';
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

type Suggestion = {
    user_id: string;
    email: string;
};

const STATUT_LABELS: Record<Collaborateur['statut'], { label: string; className: string }> = {
    en_attente: { label: 'En attente', className: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200' },
    acceptee: { label: 'Accepté', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' },
    refusee: { label: 'Refusé', className: 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-200' },
};

const ROLE_LABELS: Record<Role, string> = {
    lecture: 'Lecture seule',
    edition: 'Édition',
    admin: 'Admin',
};

const AVATAR_PALETTE = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-fuchsia-100 text-fuchsia-700',
    'bg-teal-100 text-teal-700',
];

function avatarClasses(email: string) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function Avatar({ email }: { email: string }) {
    return (
        <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarClasses(email)}`}
        >
            {email.charAt(0).toUpperCase()}
        </span>
    );
}

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
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [searching, setSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Recherche d'utilisateurs avec debounce dès que le champ email change.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const query = email.trim();
        if (query.length < 2) {
            setSuggestions([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            const { data, error } = await supabase.rpc('rechercher_utilisateurs', {
                p_tableau_id: tableauId,
                p_query: query,
            });

            if (!error) {
                setSuggestions(data ?? []);
                setShowSuggestions(true);
            }
            setSearching(false);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, tableauId]);

    // Ferme la liste de suggestions au clic en dehors du champ.
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function selectSuggestion(s: Suggestion) {
        setEmail(s.email);
        setSuggestions([]);
        setShowSuggestions(false);
    }

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
        setSuggestions([]);
        setShowSuggestions(false);
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
            <DialogContent className="gap-0 p-0 sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader className="space-y-1 px-6 pt-6">
                    <DialogTitle className="font-heading text-lg">Partager le tableau</DialogTitle>
                    <p className="text-sm text-foreground/50">
                        Invitez des personnes par email pour collaborer en temps réel.
                    </p>
                </DialogHeader>

                <div className="px-6 pt-5">
                    <div className="flex gap-2">
                        <div ref={wrapperRef} className="relative flex-1">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => {
                                    if (suggestions.length > 0) setShowSuggestions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleInvite();
                                    if (e.key === 'Escape') setShowSuggestions(false);
                                }}
                                placeholder="email@exemple.com"
                                className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition-colors placeholder:text-foreground/35 focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
                                autoComplete="off"
                            />

                            {showSuggestions && email.trim().length >= 2 && (
                                <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 max-h-52 overflow-auto rounded-xl border border-border bg-background p-1.5 shadow-lg shadow-black/5">
                                    {searching ? (
                                        <li className="flex items-center gap-2 px-2.5 py-2 text-sm text-foreground/50">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Recherche…
                                        </li>
                                    ) : suggestions.length === 0 ? (
                                        <li className="px-2.5 py-2 text-sm text-foreground/40">Aucun utilisateur trouvé.</li>
                                    ) : (
                                        suggestions.map((s) => (
                                            <li key={s.user_id}>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSuggestion(s)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground/80 transition-colors hover:bg-accent/8"
                                                >
                                                    <Avatar email={s.email} />
                                                    <span className="truncate">{s.email}</span>
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleInvite}
                            disabled={inviting || !email.trim()}
                            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            Inviter
                        </button>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-foreground/40">
                        Les nouvelles personnes invitées reçoivent le rôle « Édition » par défaut — ajustable ci-dessous une fois acceptée.
                    </p>
                </div>

                <div className="mt-5 border-t border-border/60 px-6 pb-6 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                            Collaborateurs
                        </p>
                        {!loading && collaborateurs.length > 0 && (
                            <span className="text-xs text-foreground/35">{collaborateurs.length}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 py-6 text-sm text-foreground/50">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement…
                        </div>
                    ) : collaborateurs.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 py-8 text-center">
                            <Users className="h-5 w-5 text-foreground/25" />
                            <p className="text-sm text-foreground/45">
                                Personne d&apos;autre n&apos;a encore accès à ce tableau.
                            </p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {collaborateurs.map((c) => (
                                <li
                                    key={c.user_id}
                                    className="group flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-foreground/[0.03]"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <Avatar email={c.email} />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-foreground/85">{c.email}</span>
                                            <span
                                                className={`mt-0.5 w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUT_LABELS[c.statut].className}`}
                                            >
                                                {STATUT_LABELS[c.statut].label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        {isOwner ? (
                                            <select
                                                value={c.role}
                                                disabled={updatingRoleId === c.user_id}
                                                onChange={(e) => handleRoleChange(c.user_id, e.target.value as Role)}
                                                className="h-7 rounded-md border border-border/60 bg-background px-1.5 text-xs text-foreground/70 outline-none transition-colors focus:border-accent/50 disabled:opacity-50"
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
                                            className="rounded-md p-1 text-foreground/30 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50 group-hover:opacity-100"
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