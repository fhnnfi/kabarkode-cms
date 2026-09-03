"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slug";
import { categoriesApi } from "@/lib/api/categories";
import { useCategories } from "@/features/taxonomy/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { taxonomyKeys } from "@/features/taxonomy/hooks";
import type { Category } from "@/types/models";

/**
 * Kategori via searchable popover + inline create (redesign §32, §34):
 * user tidak perlu meninggalkan editor untuk membuat kategori baru —
 * kategori baru otomatis terpilih.
 */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: categories } = useCategories();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = (categories ?? []).find((c) => c.id === value);

  async function createCategory() {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Nama kategori minimal 2 karakter.");
      return;
    }
    setBusy(true);
    try {
      const created: Category = await categoriesApi.create({ name, slug: slugify(name) });
      await qc.invalidateQueries({ queryKey: taxonomyKeys.categories });
      onChange(created.id);
      setNewName("");
      setCreating(false);
      setOpen(false);
      toast.success(`Kategori “${created.name}” dibuat & terpilih otomatis.`);
    } catch {
      /* toast ditangani api client */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Kategori</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Pilih kategori"
            className="kk-transition w-full justify-between bg-card font-normal"
          >
            <span className="truncate">{selected?.name ?? "Pilih kategori…"}</span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          {creating ? (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold">Kategori baru</p>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="mis. WebAssembly"
                onKeyDown={(e) => e.key === "Enter" && createCategory()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={createCategory} disabled={busy}>
                  {busy ? "Menyimpan…" : "Buat & pilih"}
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Search category…" />
              <CommandList>
                <CommandEmpty>Tidak ada kategori.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    — Tanpa kategori —
                  </CommandItem>
                  {(categories ?? []).map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                    >
                      {c.name}
                      {value === c.id && <Check className="ml-auto" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="+ Buat kategori baru">
                  <CommandItem
                    value="__create__"
                    onSelect={() => setCreating(true)}
                    className="text-muted-foreground"
                  >
                    <Plus /> Create category
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
