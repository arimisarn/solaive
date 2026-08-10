'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, PenLine } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { TEMPLATES, type TemplateId } from '@/lib/templates';

export function TemplatePickerDialog({
    open,
    onOpenChange,
    onSelect,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (templateId: TemplateId | null, titre: string) => void;
}) {
    const [titre, setTitre] = useState('');

    // Réinitialise le champ à chaque ouverture, pour ne pas réutiliser
    // le titre du tableau précédemment créé.
    useEffect(() => {
        if (open) setTitre('');
    }, [open]);

    const titreValide = titre.trim().length > 0;

    function handleSelect(templateId: TemplateId | null) {
        if (!titreValide) return;
        onSelect(templateId, titre.trim());
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nouveau tableau</DialogTitle>
                    <DialogDescription>
                        Donne un titre à ton tableau, puis commence de zéro ou pars d&apos;un template prêt à l&apos;emploi.
                    </DialogDescription>
                </DialogHeader>

                <input
                    type="text"
                    autoFocus
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex. Sprint planning Q3"
                    maxLength={80}
                    className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                />

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => handleSelect(null)}
                        disabled={!titreValide}
                        className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                            <PenLine className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-foreground">Tableau vierge</span>
                        <span className="text-xs text-foreground/50">Une toile blanche, sans contenu.</span>
                    </button>

                    {TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => handleSelect(template.id)}
                            disabled={!titreValide}
                            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <LayoutGrid className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{template.label}</span>
                            <span className="text-xs text-foreground/50">{template.description}</span>
                        </button>
                    ))}
                </div>

                {!titreValide && (
                    <p className="mt-1 text-xs text-foreground/40">Entre un titre pour continuer.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}