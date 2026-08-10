'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Editor } from 'tldraw';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function slugify(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'tableau';
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** Récupère les shapes à exporter : la sélection si elle existe, sinon tout le contenu de la page. */
function getExportShapeIds(editor: Editor) {
    const selected = editor.getSelectedShapeIds();
    if (selected.length > 0) return selected;
    return Array.from(editor.getCurrentPageShapeIds());
}

export function ExportBoardMenu({ editor, titre }: { editor: Editor | null; titre?: string | null }) {
    const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);
    const baseName = slugify(titre ?? 'tableau');

    async function handleExportPng() {
        if (!editor) return;
        const ids = getExportShapeIds(editor);
        if (ids.length === 0) {
            toast.error('Le tableau est vide, rien à exporter.');
            return;
        }

        setExporting('png');
        try {
            const result = await editor.toImage(ids, { format: 'png', background: true, padding: 32 });
            downloadBlob(result.blob, `${baseName}.png`);
            toast.success('Export PNG téléchargé.');
        } catch {
            toast.error("L'export PNG a échoué. Réessaie.");
        } finally {
            setExporting(null);
        }
    }

    async function handleExportPdf() {
        if (!editor) return;
        const ids = getExportShapeIds(editor);
        if (ids.length === 0) {
            toast.error('Le tableau est vide, rien à exporter.');
            return;
        }

        setExporting('pdf');
        try {
            const result = await editor.toImage(ids, { format: 'png', background: true, padding: 32 });
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('read failed'));
                reader.readAsDataURL(result.blob);
            });

            // Import dynamique : jsPDF n'a besoin d'être chargé que lors d'un export PDF.
            const { jsPDF } = await import('jspdf');
            const orientation = result.width >= result.height ? 'landscape' : 'portrait';
            const pdf = new jsPDF({
                orientation,
                unit: 'px',
                format: [result.width, result.height],
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, result.width, result.height);
            pdf.save(`${baseName}.pdf`);
            toast.success('Export PDF téléchargé.');
        } catch {
            toast.error("L'export PDF a échoué. Réessaie.");
        } finally {
            setExporting(null);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={!editor || exporting !== null}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground/60 shadow-sm backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
                    title="Exporter le tableau"
                >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPng} disabled={exporting !== null}>
                    Exporter en PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}>
                    Exporter en PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
