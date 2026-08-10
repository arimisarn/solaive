'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';
import { useInvitationsCount } from '@/components/InvitationsList';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarBadge,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar-ui';

export function AppSidebar() {
  const router = useRouter();
  const supabase = createClient();
  const invitationsCount = useInvitationsCount();
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/connexion');
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-1">
          {!collapsed && (
            <Link href="/tableau-de-bord" className="font-heading text-lg font-bold text-accent">
              Solaive
            </Link>
          )}
          <SidebarTrigger className={collapsed ? 'mx-auto' : undefined} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Tableau de bord">
                <Link href="/tableau-de-bord">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">Tableau de bord</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Invitations">
                <Link href="/invitations">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">Invitations</span>
                  {invitationsCount > 0 && <SidebarBadge>{invitationsCount}</SidebarBadge>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && email && (
          <div className="truncate px-2 text-xs text-foreground/50" title={email}>
            Connecté en tant que <span className="font-medium text-foreground/70">{email}</span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Déconnexion">
              <LogOut className="h-4 w-4 shrink-0" />
              <span data-sidebar="label">Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}