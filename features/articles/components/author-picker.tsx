"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { slugify } from "@/lib/utils/slug";
import { authorsApi } from "@/lib/api/authors";
import { useAuthors, taxonomyKeys } from "@/features/taxonomy/hooks";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Author picker dengan avatar + nama (redesign §32, §35) — bukan dropdown
 * teks polos. Mendukung inline create.
 */
export function AuthorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: authors } = useAuthors();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = (authors ?? []).find((a) => a.id === value);

  async function createAuthor() {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Nama author minimal 2 karakter.");
      return;
    }
    setBusy(true);
    try {
      const created = await authorsApi.create({ name, slug: slugify(name) });
      await qc.invalidateQueries({ queryKey: taxonomyKeys.authors });
      onChange(created.id);
      setNewName("");
      setCreating(false);
      setOpen(false);
      toast.success(`Author “${created.name}” dibuat & terpilih otomatis.`);
    } catch {
      /* toast ditangani api client */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Author</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Pilih author"
            className="kk-transition w-full justify-between bg-card font-normal"
          >
            <span className="flex min-w-0 items-center gap-2">
              {selected ? (
                <>
                  <Avatar size="sm">
                    <AvatarFallback className="bg-black text-[9px] text-white">
                      {selected.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selected.name}</span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    @{selected.slug}
                  </span>
                </>
              ) : (
                "Pilih author…"
              )}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          {creating ? (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold">Author baru</p>
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama lengkap"
                onKeyDown={(e) => e.key === "Enter" && createAuthor()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={createAuthor} disabled={busy}>
                  {busy ? "Menyimpan…" : "Buat & pilih"}
                </Button>
              </div>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Search author…" />
              <CommandList>
                <CommandEmpty>Tidak ada author.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__none__"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    — Belum ditentukan —
                  </CommandItem>
                  {(authors ?? []).map((a) => (
                    <CommandItem
                      key={a.id}
                      value={a.name}
                      onSelect={() => {
                        onChange(a.id);
                        setOpen(false);
                      }}
                      className="gap-2"
                    >
                      <Avatar size="sm">
                        <AvatarFallback className="bg-black text-[9px] text-white">
                          {a.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1 truncate">{a.name}</span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        @{a.slug}
                      </span>
                      {value === a.id && <Check className="size-3.5 shrink-0" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="+ Buat author baru">
                  <CommandItem
                    value="__create__"
                    onSelect={() => setCreating(true)}
                    className="text-muted-foreground"
                  >
                    <Plus /> Create author
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
