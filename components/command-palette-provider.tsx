"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CommandPalette } from "@/components/command-palette";

/**
 * Global command palette launcher (redesign §15, §42):
 * Ctrl/Cmd+K membuka palette dari halaman mana pun.
 */
export function CommandPaletteProvider() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
