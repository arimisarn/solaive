'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Bell,
  Star,
  Keyboard,
  Settings,
  Trash2,
  LayoutGrid,
} from 'lucide-react';

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
      {/* Header */}
      <SidebarHeader>
        <div className="flex items-center justify-between px-1">
          <Link
            href="/tableau-de-bord"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Solaive"
              width={140}
              height={60}
              className="h-12 w-auto object-contain"
              priority
            />

            {!collapsed && (
              <span className="font-heading text-lg font-bold text-accent">
                Solaive
              </span>
            )}
          </Link>

          <SidebarTrigger
            className={collapsed ? 'mx-auto' : undefined}
          />
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-3">
            {/* Tableau de bord */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Tableau de bord"
                className="h-11"
              >
                <Link href="/tableau-de-bord">
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">
                    Tableau de bord
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Modèles */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Modèles"
                className="h-11"
              >
                <Link href="/modeles">
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">
                    Modèles
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Favoris */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Favoris"
                className="h-11"
              >
                <Link href="/favoris">
                  <Star className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">
                    Favoris
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Invitations */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Invitations"
                className="h-11"
              >
                <Link href="/invitations">
                  <Bell className="h-4 w-4 shrink-0" />

                  <span data-sidebar="label">
                    Invitations
                  </span>

                  {invitationsCount > 0 && (
                    <SidebarBadge>
                      {invitationsCount}
                    </SidebarBadge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Raccourcis */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Raccourcis clavier"
                className="h-11"
              >
                <Link href="/raccourcis">
                  <Keyboard className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">
                    Raccourcis
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Corbeille */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Corbeille"
                className="h-11"
              >
                <Link href="/corbeille">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span data-sidebar="label">
                    Corbeille
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {email && (
          <div
            className={
              collapsed
                ? 'flex flex-col items-center gap-1'
                : 'flex items-center gap-2 px-1'
            }
          >
            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-accent text-xs font-semibold text-white">
                {email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Email */}
            {!collapsed && (
              <span
                className="min-w-0 flex-1 truncate text-xs text-foreground/60"
                title={email}
              >
                {email}
              </span>
            )}

            {/* Settings */}
            <Link
              href="/parametres"
              title="Paramètres"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Logout */}
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Déconnexion"
              className="h-11"
            >
              <LogOut className="h-4 w-4 shrink-0" />

              <span data-sidebar="label">
                Déconnexion
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}