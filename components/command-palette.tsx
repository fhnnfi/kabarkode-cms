"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2,
  FileText,
  FolderTree,
  Images,
  LayoutDashboard,
  Tags,
  Upload,
  UserPen,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { articlesApi } from "@/lib/api/articles";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import type { Article } from "@/types/models";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command palette global (redesign §15): CREATE / NAVIGATE / hasil pencarian
 * artikel server-side. Mengurangi navigasi dan ketergantungan dropdown.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);

  // Debounce pencarian artikel via API yang sudah ada (tanpa endpoint baru).
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      setSearching(true);
      const fetcher = user?.role === "author" ? articlesApi.listMine : articlesApi.listAll;
      fetcher({ search: q, limit: 6, page: 1 })
        .then((r) => setResults(r.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, user]);

  function go(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  const nav = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(can(user?.role, "manage_articles")
      ? [{ title: "Articles", href: "/articles", icon: FileText }]
      : []),
    ...(can(user?.role, "manage_media")
      ? [{ title: "Media", href: "/media", icon: Images }]
      : []),
    ...(can(user?.role, "manage_categories")
      ? [{ title: "Categories", href: "/categories", icon: FolderTree }]
      : []),
    ...(can(user?.role, "manage_tags")
      ? [{ title: "Tags", href: "/tags", icon: Tags }]
      : []),
    ...(can(user?.role, "manage_authors")
      ? [{ title: "Authors", href: "/authors", icon: UserPen }]
      : []),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery("");
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-h-[80vh] translate-y-0 gap-0 overflow-hidden rounded-2xl border-border p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search KabarKode…"
          />
          <CommandList className="max-h-[50vh]">
            <CommandEmpty>
              {searching ? "Mencari…" : "Tidak ada hasil."}
            </CommandEmpty>

            <CommandGroup heading="Create">
              {can(user?.role, "manage_articles") && (
                <CommandItem value="new article tulis artikel" onSelect={() => go("/articles/new")}>
                  <FilePlus2 />
                  New Article
                </CommandItem>
              )}
              {can(user?.role, "manage_media") && (
                <CommandItem value="upload media gambar aset" onSelect={() => go("/media")}>
                  <Upload />
                  Upload Media
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {nav.map((n) => (
                <CommandItem key={n.href} value={`nav-${n.href}`} onSelect={() => go(n.href)}>
                  <n.icon />
                  {n.title}
                </CommandItem>
              ))}
            </CommandGroup>

            {query.trim().length >= 2 && results.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Articles">
                  {results.map((a) => (
                    <CommandItem
                      key={a.id}
                      value={a.title}
                      onSelect={() => go(`/articles/${a.id}/edit`)}
                    >
                      <FileText />
                      <span className="min-w-0 flex-1 truncate">{a.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {a.status}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
