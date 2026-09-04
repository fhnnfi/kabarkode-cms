"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isUnsavedDirty, setUnsavedDirty, subscribeUnsaved } from "@/lib/unsaved-store";

/**
 * Guard navigasi global: bila editor menandai ada perubahan belum disimpan,
 * SEMUA tautan SPA internal (breadcrumb, sidebar, command palette, dst.)
 * tertahan oleh dialog konfirmasi — bukan hanya tombol back editor.
 */
export function NavigationGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => subscribeUnsaved(() => setDirty(isUnsavedDirty())), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!isUnsavedDirty()) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || anchor.target === "_blank" || anchor.download) return;
      if (href === pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget(href);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ada perubahan belum disimpan</DialogTitle>
          <DialogDescription>Artikelmu punya perubahan yang belum disimpan.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTarget(null)}>
            Tetap di sini
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const t = target!;
              setTarget(null);
              setUnsavedDirty(false); // buang perubahan: boleh keluar
              router.push(t);
            }}
          >
            Buang perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
