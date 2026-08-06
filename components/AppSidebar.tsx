'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';
import { InvitationsList, useInvitationsCount } from '@/components/InvitationsList';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarBadge,
  SidebarTrigger,
} from '@/components/ui/sidebar-ui';

export function AppSidebar({ onInvitationResolved }: { onInvitationResolved?: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const invitationsCount = useInvitationsCount();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/connexion');
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-1">
          <Link href="/tableau-de-bord" className="font-heading text-lg font-bold text-accent">
            Solaive
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Tableau de bord">
                <Link href="/tableau-de-bord">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span>Tableau de bord</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Invitations
            {invitationsCount > 0 && <SidebarBadge>{invitationsCount}</SidebarBadge>}
          </SidebarGroupLabel>
          <div className="px-1">
            <InvitationsList onResolved={onInvitationResolved} />
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Déconnexion">
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
