"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { useAuth } from "@/features/auth/auth-provider";

// Redesign §14: header kontekstual — breadcrumb + shortcut ⌘K + user menu.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  articles: "Articles",
  media: "Media",
  categories: "Categories",
  tags: "Tags",
  authors: "Authors",
  settings: "Pengaturan",
  new: "New Article",
  edit: "Edit Article",
  preview: "Preview",
};

function useBreadcrumbSegments() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const isId = /^[0-9a-f-]{20,}$/i.test(p);
    return { label: isId ? "…" : (SEGMENT_LABELS[p] ?? p), href, isId };
  });
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const segments = useBreadcrumbSegments();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" aria-label="Buka/tutup sidebar" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="min-w-0 text-sm">
          {segments.map((s, i) => (
            <Fragment key={s.href}>
              {i > 0 && <BreadcrumbSeparator className="hidden sm:flex" />}
              <BreadcrumbItem className="min-w-0">
                {i === segments.length - 1 ? (
                  <BreadcrumbPage className="truncate font-semibold">
                    {s.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="hidden truncate sm:inline-flex">
                    <Link href={s.isId ? "/articles" : s.href}>{s.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-3">
        <CommandPaletteProvider />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="kk-transition size-9 rounded-full ring-offset-2 ring-offset-background data-[state=open]:ring-2 data-[state=open]:ring-brand"
              aria-label="Menu pengguna"
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-black text-[10px] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          {/* Redesign §62: user menu sederhana. */}
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate font-semibold">{user?.email?.split("@")[0]}</span>
              <span className="truncate font-mono text-xs font-normal text-muted-foreground">
                {user?.email} · {user?.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User /> Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOut /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
