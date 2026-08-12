'use client';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { Keyboard } from 'lucide-react';

type Shortcut = { keys: string[]; label: string };
type Section = { title: string; shortcuts: Shortcut[] };

// Raccourcis propres à l'app : voir components/ui/sidebar-ui.tsx pour celui
// de la sidebar (seul raccourci custom du projet actuellement). Les autres
// sections documentent les raccourcis natifs de tldraw (non redéfinis ici,
// donc à tenir à jour manuellement si tldraw change ses défauts).
const SECTIONS: Section[] = [
    {
        title: 'Application',
        shortcuts: [{ keys: ['Ctrl', 'B'], label: 'Afficher / masquer la barre latérale' }],
    },
    {
        title: 'Outils de dessin',
        shortcuts: [
            { keys: ['V'], label: 'Sélection' },
            { keys: ['D'], label: 'Stylo / dessin libre' },
            { keys: ['R'], label: 'Rectangle' },
            { keys: ['O'], label: 'Ellipse' },
            { keys: ['A'], label: 'Flèche' },
            { keys: ['L'], label: 'Ligne' },
            { keys: ['T'], label: 'Texte' },
            { keys: ['N'], label: 'Post-it' },
            { keys: ['E'], label: 'Gomme' },
            { keys: ['F'], label: 'Cadre (frame)' },
        ],
    },
    {
        title: 'Édition',
        shortcuts: [
            { keys: ['Ctrl', 'Z'], label: 'Annuler' },
            { keys: ['Ctrl', 'Shift', 'Z'], label: 'Rétablir' },
            { keys: ['Ctrl', 'C'], label: 'Copier' },
            { keys: ['Ctrl', 'V'], label: 'Coller' },
            { keys: ['Ctrl', 'A'], label: 'Tout sélectionner' },
            { keys: ['Suppr'], label: 'Supprimer la sélection' },
            { keys: ['Ctrl', 'D'], label: 'Dupliquer la sélection' },
        ],
    },
    {
        title: 'Navigation du canvas',
        shortcuts: [
            { keys: ['Espace', 'Glisser'], label: 'Déplacer la vue (pan)' },
            { keys: ['Molette'], label: 'Zoomer / dézoomer' },
            { keys: ['Ctrl', '0'], label: 'Réinitialiser le zoom (100 %)' },
            { keys: ['Ctrl', '+'], label: 'Zoomer' },
            { keys: ['Ctrl', '-'], label: 'Dézoomer' },
            { keys: ['Shift', '1'], label: "Cadrer sur tout le contenu" },
        ],
    },
];

function KeyCap({ children }: { children: string }) {
    return (
        <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground/80 shadow-sm">
            {children}
        </kbd>
    );
}

export default function RaccourcisPage() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Raccourcis clavier</span>
                </header>

                <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex animate-fade-up items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <Keyboard className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                Raccourcis clavier
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Pour aller plus vite sur l&apos;application et sur le canvas.
                            </p>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-8">
                        {SECTIONS.map((section, si) => (
                            <div
                                key={section.title}
                                className="animate-fade-up"
                                style={{ animationDelay: `${si * 0.06}s` }}
                            >
                                <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground/50">
                                    {section.title}
                                </h2>
                                <div className="overflow-hidden rounded-xl border border-border bg-card">
                                    {section.shortcuts.map((s, i) => (
                                        <div
                                            key={s.label}
                                            className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${i !== section.shortcuts.length - 1 ? 'border-b border-border/60' : ''
                                                }`}
                                        >
                                            <span className="text-foreground/80">{s.label}</span>
                                            <span className="flex shrink-0 items-center gap-1">
                                                {s.keys.map((k, ki) => (
                                                    <span key={k} className="flex items-center gap-1">
                                                        <KeyCap>{k}</KeyCap>
                                                        {ki < s.keys.length - 1 && (
                                                            <span className="text-foreground/30">+</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-xs text-foreground/40">
                        Sur Mac, remplace Ctrl par ⌘ (Cmd).
                    </p>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}