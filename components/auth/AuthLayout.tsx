import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sparkles, Users, History, MessageSquare } from 'lucide-react';

const BENEFITS = [
    { icon: Users, text: 'Collaborez en temps réel avec toute votre équipe' },
    { icon: MessageSquare, text: 'Commentez et réagissez directement sur le tableau' },
    { icon: History, text: 'Historique complet, revenez en arrière à tout moment' },
];

interface AuthLayoutProps {
    bannerTitle: string;
    bannerSubtitle: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function AuthLayout({
    bannerTitle,
    bannerSubtitle,
    title,
    subtitle,
    children,
    footer,
}: AuthLayoutProps) {
    return (
        <>
            <Header />

            {/* Bandeau full-width avec texture en pointillés */}
            <section
                className="relative flex h-[220px] w-full items-center overflow-hidden bg-accent px-4 sm:h-[260px] sm:px-6 md:h-[300px] lg:px-8"
                style={{
                    backgroundImage:
                        'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                }}
            >
                <div className="mx-auto w-full max-w-6xl">
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-accent-foreground sm:text-3xl md:text-4xl">
                        {bannerTitle}
                    </h2>
                    <p className="mt-3 max-w-md text-sm text-accent-foreground/80 sm:text-base">
                        {bannerSubtitle}
                    </p>
                </div>
            </section>

            <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
                {/* Panneau décoratif à gauche (masqué sur mobile) */}
                <div className="hidden lg:block">
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent to-primary p-8 text-accent-foreground">
                        <Sparkles className="h-8 w-8 text-accent-foreground/70" />
                        <h3 className="mt-6 font-heading text-2xl font-bold leading-snug">
                            Le tableau blanc collaboratif pour les équipes qui avancent vite.
                        </h3>
                        <ul className="mt-8 space-y-4">
                            {BENEFITS.map((b) => (
                                <li key={b.text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">
                                        <b.icon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm text-accent-foreground/90">{b.text}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    </div>
                </div>

                {/* Carte du formulaire, alignée à gauche (plus centrée) */}
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 lg:justify-self-end">
                    <div className="mb-6">
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2 text-sm text-foreground/60">{subtitle}</p>
                        )}
                    </div>

                    {children}

                    {footer && (
                        <p className="mt-6 text-center text-sm text-foreground/70">{footer}</p>
                    )}
                </div>
            </div>

            <Footer />
        </>
    );
}