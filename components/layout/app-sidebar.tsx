"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  Settings,
  Tags,
  UserPen,
} from "lucide-react";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { BrandLockup, BrandMark } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/auth-provider";
import { can, type Permission } from "@/lib/auth/permissions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

// Redesign §12: section labels WORKSPACE / ORGANIZE, bukan grup berlebihan.
const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Articles", href: "/articles", icon: FileText, permission: "manage_articles" },
      { title: "Media", href: "/media", icon: Images, permission: "manage_media" },
    ],
  },
  {
    label: "Organize",
    items: [
      { title: "Categories", href: "/categories", icon: FolderTree, permission: "manage_categories" },
      { title: "Tags", href: "/tags", icon: Tags, permission: "manage_tags" },
      { title: "Authors", href: "/authors", icon: UserPen, permission: "manage_authors" },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  author: "Author",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring data-[collapsible=icon]:justify-center"
        >
          {/* Saat collapsed, SidebarMenuButton tidak dipakai di sini — render mark saja. */}
          <span className="hidden group-data-[collapsible=icon]:inline-flex">
            <BrandMark size={32} />
          </span>
          <span className="group-data-[collapsible=icon]:hidden">
            <BrandLockup size={32} subtitle="Editorial Workspace" />
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.permission || can(user?.role, i.permission));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="font-mono text-[10px] tracking-widest uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
        <div className="mt-auto" />
        <SidebarGroup className="py-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Profil" isActive={pathname.startsWith("/profile")}>
                <Link href="/profile">
                  <UserPen />
                  <span>Profil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              {user?.role !== "author" && (
                <SidebarMenuButton asChild tooltip="Pengaturan" isActive={pathname.startsWith("/settings")}>
                  <Link href="/settings">
                    <Settings />
                    <span>Pengaturan</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* Redesign §12, §62: user area di dasar sidebar. */}
      <SidebarFooter className="px-3 py-4">
        <div className="flex items-center gap-2.5 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <Avatar size="sm" className="ring-2 ring-brand/60">
            <AvatarFallback className="bg-black text-xs text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">
              {user?.email?.split("@")[0] ?? "—"}
            </span>
            <span className="truncate font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
              {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? ""}
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
