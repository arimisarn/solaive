'use client';

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
    onSelect: (templateId: TemplateId | null) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nouveau tableau</DialogTitle>
                    <DialogDescription>
                        Commence de zéro ou pars d&apos;un template prêt à l&apos;emploi.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
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
                            onClick={() => onSelect(template.id)}
                            className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <LayoutGrid className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-medium text-foreground">{template.label}</span>
                            <span className="text-xs text-foreground/50">{template.description}</span>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
