'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar-ui';
import { InvitationsList } from '@/components/InvitationsList';
import { createClient } from '@/lib/supabase/clients';

export default function InvitationsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                router.push('/connexion');
                return;
            }
            setChecking(false);
        }
        checkAuth();
    }, [router, supabase]);

    if (checking) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-3 border-b border-border/60 bg-card px-4 sm:px-6 lg:px-8">
                    <SidebarTrigger className="md:hidden" />
                    <span className="font-heading text-lg font-semibold text-foreground">Invitations</span>
                </header>

                <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="animate-fade-up">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <Mail className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                                    Invitations
                                </h1>
                                <p className="text-sm text-foreground/60">
                                    Les tableaux que d&apos;autres personnes veulent partager avec toi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <InvitationsList />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}