"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CommandPalette } from "@/components/command-palette";
import { NAV_SHORTCUTS, paletteLabel } from "@/lib/nav-shortcuts";
import { useIsMac } from "@/hooks/use-is-mac";
import { isUnsavedDirty } from "@/lib/unsaved-store";

/**
 * Global command palette launcher (redesign §15, §42):
 * Ctrl/Cmd+K membuka palette; Alt+1/2/3/Alt+N navigasi antar tab.
 * (Alt, bukan Ctrl+angka — Ctrl+1..9 & Ctrl+Shift+A reserved oleh
 * Chrome/Edge di Windows dan tidak bisa di-intercept web app.)
 */
export function CommandPaletteProvider() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Palette: Ctrl/Cmd+K (browser tidak merreserve kombinasi ini).
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Navigasi: Alt+angka / Alt+N (aman di Windows & Mac).
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toUpperCase();
        const target = NAV_SHORTCUTS.find((s) => s.keys === k);
        if (target && !pathname?.startsWith("/login")) {
          e.preventDefault();
          if (!isUnsavedDirty()) router.push(target.href);
        }
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
  const mac = useIsMac();
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
      <Kbd className="hidden sm:inline-flex">{paletteLabel(mac)}</Kbd>
    </Button>
  );
}
