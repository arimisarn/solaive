'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tldraw, computed, createUserId, inlineBase64AssetStore, UserRecordType } from 'tldraw';
import 'tldraw/tldraw.css';
import { useSync } from '@tldraw/sync';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';

const CURSOR_COLORS = ['#7C3AED', '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EC4899'];

function colorForUser(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export default function TableauPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const supabase = createClient();

    const [status, setStatus] = useState<'checking' | 'ok' | 'not-found'>('checking');
    const [userInfo, setUserInfo] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        async function checkAccess() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                router.push('/connexion');
                return;
            }

            setUserInfo({
                id: userData.user.id,
                name: userData.user.email?.split('@')[0] ?? 'Utilisateur',
            });

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

    const currentUser = useMemo(
        () =>
            computed('current-user', () =>
                userInfo
                    ? UserRecordType.create({
                        id: createUserId(userInfo.id),
                        name: userInfo.name,
                        color: colorForUser(userInfo.id),
                    })
                    : null
            ),
        [userInfo]
    );

    const store = useSync(
        useMemo(
            () => ({
                uri: `ws://localhost:5858/connect/${id}`,
                assets: inlineBase64AssetStore,
                users: { currentUser },
            }),
            [id, currentUser]
        )
    );

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
            <Tldraw store={store} />
        </div>
    );
}