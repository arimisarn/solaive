'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';

export default function TableauPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const supabase = createClient();

    const [status, setStatus] = useState<'checking' | 'ok' | 'not-found'>('checking');

    useEffect(() => {
        async function checkAccess() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                router.push('/connexion');
                return;
            }

            const { data, error } = await supabase
                .from('tableaux')
                .select('id')
                .eq('id', id)
                .eq('owner_id', userData.user.id)
                .maybeSingle();

            if (error || !data) {
                setStatus('not-found');
                return;
            }

            setStatus('ok');
        }

        checkAccess();
    }, [id, router, supabase]);

    if (status === 'checking') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    if (status === 'not-found') {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background">
                <p className="text-foreground/70">Ce tableau n'existe pas ou tu n'y as pas accès.</p>
                <button
                    type="button"
                    onClick={() => router.push('/tableau-de-bord')}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-accent hover:border-accent/40"
                >
                    Retour au tableau de bord
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0">
            <Tldraw persistenceKey={`solaive-${id}`} />
        </div>
    );
}