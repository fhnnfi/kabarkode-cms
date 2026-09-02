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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/auth-provider";
import { can, type Permission } from "@/lib/auth/permissions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Konten",
    items: [
      { title: "Artikel", href: "/articles", icon: FileText, permission: "manage_articles" },
      { title: "Kategori", href: "/categories", icon: FolderTree, permission: "manage_categories" },
      { title: "Tag", href: "/tags", icon: Tags, permission: "manage_tags" },
      { title: "Authors", href: "/authors", icon: UserPen, permission: "manage_authors" },
    ],
  },
  {
    label: "Media",
    items: [{ title: "Media Library", href: "/media", icon: Images, permission: "manage_media" }],
  },
  {
    label: "Sistem",
    items: [{ title: "Pengaturan", href: "/settings", icon: Settings }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-bold">
                  K
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">KabarKode CMS</span>
                  <span className="truncate text-xs text-muted-foreground">Newsroom</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.permission || can(user?.role, i.permission));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label || "main"}>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
