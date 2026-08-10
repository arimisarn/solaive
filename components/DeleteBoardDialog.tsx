'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/clients';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DeleteBoardDialog({
    tableauId,
    titre,
    onDeleted,
    trigger,
}: {
    tableauId: string;
    titre?: string | null;
    /** Appelé une fois la suppression confirmée en base. */
    onDeleted: () => void;
    trigger?: React.ReactNode;
}) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        setDeleting(true);

        const { error } = await supabase.from('tableaux').delete().eq('id', tableauId);

        setDeleting(false);

        if (error) {
            toast.error("Impossible de supprimer le tableau. Réessaie.");
            return;
        }

        setOpen(false);
        toast.success('Tableau supprimé.');
        onDeleted();
    }

    return (
        <AlertDialog open={open} onOpenChange={(next) => !deleting && setOpen(next)}>
            <AlertDialogTrigger asChild>
                {trigger ?? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white"
                    >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                    </button>
                )}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce tableau ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {titre ? (
                            <>
                                Le tableau <span className="font-medium text-foreground">« {titre} »</span> sera
                                définitivement supprimé, ainsi que tout son contenu et les invitations associées.
                                Cette action est irréversible.
                            </>
                        ) : (
                            'Le tableau sera définitivement supprimé, ainsi que tout son contenu et les invitations associées. Cette action est irréversible.'
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={deleting}
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression…
                            </>
                        ) : (
                            'Supprimer définitivement'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}