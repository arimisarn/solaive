'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';

function validatePassword(pw: string): string | undefined {
    if (pw.length < 8) return 'Au moins 8 caractères';
    if (!/[A-Z]/.test(pw)) return 'Doit contenir une majuscule';
    if (!/\d/.test(pw)) return 'Doit contenir un chiffre';
    return undefined;
}

export default function MettreAJourMotDePassePage() {
    const router = useRouter();
    const supabase = createClient();
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Le lien de reset passe par /auth/callback, qui échange le code contre
        // une session avant de rediriger ici. Si on arrive sur cette page sans
        // session (lien expiré, déjà utilisé, ou accès direct à l'URL), on ne
        // peut pas laisser remplir le formulaire.
        async function checkSession() {
            const { data } = await supabase.auth.getSession();
            setHasSession(!!data.session);
            setCheckingSession(false);
        }
        checkSession();
    }, [supabase]);

    const passwordError = validatePassword(password);
    const isFormValid = !passwordError && password === confirm;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isFormValid) return;
        setLoading(true);
        setError(undefined);

        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (error) {
            setError("Impossible de mettre à jour le mot de passe. Réessaie.");
            return;
        }

        toast.success('Mot de passe mis à jour.');
        router.push('/tableau-de-bord');
    }

    if (checkingSession) {
        return (
            <AuthCard title="Nouveau mot de passe" subtitle="Vérification du lien…">
                <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
            </AuthCard>
        );
    }

    if (!hasSession) {
        return (
            <AuthCard
                title="Lien invalide ou expiré"
                subtitle="Demande un nouveau lien de réinitialisation."
            >

                href="/mot-de-passe-oublie"
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90"
                <a>
                    Retour à la réinitialisation
                </a>
            </AuthCard >
        );
    }

    return (
        <AuthCard
            title="Nouveau mot de passe"
            subtitle="Choisis un nouveau mot de passe pour ton compte."
        >
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5 animate-fade-up">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10 focus-visible:ring-accent"
                            aria-invalid={!!passwordError}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-foreground/50 hover:text-accent"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {password && passwordError && (
                        <p aria-live="polite" className="text-xs text-destructive">{passwordError}</p>
                    )}
                </div>

                <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
                    <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                    <Input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="focus-visible:ring-accent"
                        aria-invalid={!!confirm && confirm !== password}
                    />
                    {confirm && confirm !== password && (
                        <p aria-live="polite" className="text-xs text-destructive">
                            Les mots de passe ne correspondent pas
                        </p>
                    )}
                </div>

                {error && (
                    <p aria-live="polite" className="text-xs text-destructive">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                </button>
            </form>
        </AuthCard>
    );
}