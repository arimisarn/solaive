'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, PenLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/clients';
import { TEMPLATES, type TemplateId } from '@/lib/templates';

type Choix = { templateId: TemplateId | null; label: string; description: string };

const VIERGE: Choix = {
    templateId: null,
    label: 'Tableau vierge',
    description: 'Une toile blanche, sans contenu.',
};

export default function ModelesPage() {
    const router = useRouter();
    const supabase = createClient();
    const [selected, setSelected] = useState<Choix | null>(null);
    const [titre, setTitre] = useState('');
    const [creating, setCreating] = useState(false);

    const titreValide = titre.trim().length > 0;

    function openDialog(choix: Choix) {
        setTitre('');
        setSelected(choix);
    }

    async function handleCreate() {
        if (!selected || !titreValide) return;
        setCreating(true);

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            setCreating(false);
            router.push('/connexion');
            return;
        }

        const { data, error } = await supabase
            .from('tableaux')
            .insert({ owner_id: userData.user.id, titre: titre.trim() })
            .select('id')
            .single();

        setCreating(false);

        if (error || !data) {
            toast.error("Impossible de créer le tableau. Réessaie.");
            return;
        }

        setSelected(null);
        router.push(
            selected.templateId ? `/tableau/${data.id}?template=${selected.templateId}` : `/tableau/${data.id}`
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Modèles</span>
                </header>

                <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex animate-fade-up items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <LayoutGrid className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                Modèles
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Choisis un point de départ pour ton prochain tableau.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <button
                            type="button"
                            onClick={() => openDialog(VIERGE)}
                            className="flex animate-fade-up flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <PenLine className="h-5 w-5" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{VIERGE.label}</span>
                            <span className="text-xs text-foreground/50">{VIERGE.description}</span>
                        </button>

                        {TEMPLATES.map((template, i) => (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() =>
                                    openDialog({
                                        templateId: template.id,
                                        label: template.label,
                                        description: template.description,
                                    })
                                }
                                className="flex animate-fade-up flex-col items-start gap-2 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
                                style={{ animationDelay: `${(i + 1) * 0.05}s` }}
                            >
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                    <LayoutGrid className="h-5 w-5" />
                                </span>
                                <span className="text-sm font-medium text-foreground">{template.label}</span>
                                <span className="text-xs text-foreground/50">{template.description}</span>
                            </button>
                        ))}
                    </div>
                </main>
            </SidebarInset>

            <Dialog open={selected !== null} onOpenChange={(next) => !creating && !next && setSelected(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{selected?.label}</DialogTitle>
                        <DialogDescription>Donne un titre à ton tableau pour continuer.</DialogDescription>
                    </DialogHeader>

                    <input
                        type="text"
                        autoFocus
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && titreValide && !creating) handleCreate();
                        }}
                        placeholder="Ex. Sprint planning Q3"
                        maxLength={80}
                        className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!titreValide || creating}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {creating ? 'Création…' : 'Créer le tableau'}
                    </button>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}