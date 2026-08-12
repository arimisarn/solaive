'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, Laptop, Settings, LogOut, Sparkles } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/clients';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const THEME_OPTIONS = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Laptop },
] as const;

export default function ParametresPage() {
    const router = useRouter();
    const supabase = createClient();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [email, setEmail] = useState<string | null>(null);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        setMounted(true);
        supabase.auth.getUser().then(({ data }) => {
            setEmail(data.user?.email ?? null);
        });
        const stored = localStorage.getItem('solaive-reduce-motion') === '1';
        setReduceMotion(stored);
        document.documentElement.classList.toggle('reduce-motion', stored);
    }, [supabase]);

    function toggleReduceMotion(checked: boolean) {
        setReduceMotion(checked);
        localStorage.setItem('solaive-reduce-motion', checked ? '1' : '0');
        document.documentElement.classList.toggle('reduce-motion', checked);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/connexion');
        router.refresh();
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Paramètres</span>
                </header>

                <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex animate-fade-up items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <Settings className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                Paramètres
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Personnalise ton expérience Solaive.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        {/* Apparence */}
                        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="font-heading text-base font-semibold text-foreground">Apparence</h2>
                            <p className="mt-1 text-sm text-foreground/60">Choisis le thème de l&apos;interface.</p>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                                    const active = mounted && theme === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setTheme(value)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors',
                                                active
                                                    ? 'border-accent bg-accent/10 text-accent'
                                                    : 'border-border text-foreground/70 hover:bg-secondary'
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Accessibilité */}
                        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="font-heading text-base font-semibold text-foreground">Accessibilité</h2>
                            <p className="mt-1 text-sm text-foreground/60">Réglages de confort visuel.</p>

                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-foreground/50" />
                                    <Label htmlFor="reduce-motion" className="text-sm text-foreground">
                                        Réduire les animations
                                    </Label>
                                </div>
                                <Switch
                                    id="reduce-motion"
                                    checked={reduceMotion}
                                    onCheckedChange={toggleReduceMotion}
                                />
                            </div>
                        </section>

                        {/* Compte */}
                        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="font-heading text-base font-semibold text-foreground">Compte</h2>
                            {email && <p className="mt-1 text-sm text-foreground/60">Connecté en tant que {email}</p>}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                Se déconnecter
                            </button>
                        </section>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}