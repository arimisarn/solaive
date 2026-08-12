'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Bell, Star, Keyboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/clients';
import { useInvitationsCount } from '@/components/InvitationsList';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
              <SidebarMenuButton asChild tooltip="Favoris">
                <Link href="/favoris">
                  <Star className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">Favoris</span>
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

            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Raccourcis clavier">
                <Link href="/raccourcis">
                  <Keyboard className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">Raccourcis</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {email && (
          <div className={collapsed ? 'flex justify-center' : 'flex items-center gap-2 px-1'}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent text-xs font-semibold text-white">
                {email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="min-w-0 truncate text-xs text-foreground/60" title={email}>
                {email}
              </span>
            )}
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