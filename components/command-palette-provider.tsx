"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CommandPalette } from "@/components/command-palette";

import { NAV_SHORTCUTS } from "@/lib/nav-shortcuts";
import { isUnsavedDirty } from "@/lib/unsaved-store";

/**
 * Global command palette launcher (redesign §15, §42):
 * Ctrl/Cmd+K membuka palette; Ctrl/Cmd+1/2/3 & Ctrl/Cmd+Shift+A navigasi.
 */
export function CommandPaletteProvider() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Shift+A = New Article; angka = tab utama.
      const target = NAV_SHORTCUTS.find(
        (s) =>
          (s.keys === "A" && e.shiftKey && k === "a") ||
          (s.keys !== "A" && !e.shiftKey && k === s.keys),
      );
      if (target && !pathname?.startsWith("/login")) {
        e.preventDefault();
        if (!isUnsavedDirty()) router.push(target.href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname]);

  return (
    <>
      <PaletteTrigger onOpen={() => setOpen(true)} />
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

// Trigger hanya tampil di halaman dashboard (header); login tidak punya pathname match.
function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/login")) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onOpen}
      aria-label="Buka command palette"
      className="kk-transition gap-2 rounded-lg border-border/80 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
    >
      <Command className="size-3.5" />
      <span className="hidden text-xs sm:inline">Cari atau lakukan…</span>
      <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
    </Button>
  );
}
