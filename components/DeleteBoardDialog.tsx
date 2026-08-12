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
    /** Appelé une fois le tableau déplacé dans la corbeille. */
    onDeleted: () => void;
    trigger?: React.ReactNode;
}) {
    const supabase = createClient();
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        setDeleting(true);

        // Soft-delete : on ne supprime plus la ligne, on la marque comme
        // corbeillée (deleted_at). lister_mes_tableaux filtre déjà dessus,
        // donc le tableau disparaît du dashboard immédiatement, pour le
        // owner comme pour les collaborateurs.
        const { error } = await supabase.rpc('mettre_a_la_corbeille', {
            p_tableau_id: tableauId,
        });

        setDeleting(false);

        if (error) {
            toast.error("Impossible de déplacer le tableau vers la corbeille. Réessaie.");
            return;
        }

        setOpen(false);
        toast.success('Tableau déplacé dans la corbeille.');
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
                    <AlertDialogTitle>Déplacer ce tableau vers la corbeille ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {titre ? (
                            <>
                                Le tableau <span className="font-medium text-foreground">« {titre} »</span> sera
                                déplacé dans la corbeille et n&apos;apparaîtra plus dans le tableau de bord. Tu
                                pourras le restaurer ou le supprimer définitivement depuis la corbeille.
                            </>
                        ) : (
                            "Le tableau sera déplacé dans la corbeille et n'apparaîtra plus dans le tableau de bord. Tu pourras le restaurer ou le supprimer définitivement depuis la corbeille."
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
                                Déplacement…
                            </>
                        ) : (
                            'Déplacer vers la corbeille'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}