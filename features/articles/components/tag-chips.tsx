"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { tagsApi } from "@/lib/api/tags";
import { useTags, taxonomyKeys } from "@/features/taxonomy/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";

/**
 * Tags sebagai chips + search-or-create (redesign §32, §33):
 * chip terpilih tampil inline, popover untuk menambah — bukan multi-select
 * dropdown generik. Tag baru dibuat inline dan langsung menempel.
 */
export function TagChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: tags } = useTags();
  const qc = useQueryClient();
  const { user } = useAuth();
  const mayCreate = can(user?.role, "manage_tags");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const selected = (tags ?? []).filter((t) => value.includes(t.id));

  async function createTag(name: string) {
    setBusy(true);
    try {
      const created = await tagsApi.create({ name, slug: slugify(name) });
      await qc.invalidateQueries({ queryKey: taxonomyKeys.tags });
      onChange([...value, created.id]);
      toast.success(`Tag “${created.name}” dibuat & ditambahkan.`);
    } catch {
      /* toast ditangani api client */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>Tags</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((t) => (
          <Badge key={t.id} variant="secondary" className="kk-transition gap-1 rounded-full pr-1">
            {t.name}
            <button
              type="button"
              aria-label={`Hapus tag ${t.name}`}
              className="kk-transition rounded-full p-0.5 hover:bg-foreground/10"
              onClick={() => onChange(value.filter((id) => id !== t.id))}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="kk-transition h-6 gap-1 rounded-full px-2 text-xs"
              disabled={busy}
            >
              <Plus className="size-3" /> Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search or create tag…"
              />
              <CommandList>
                <CommandEmpty>Tidak ada tag cocok.</CommandEmpty>
                <CommandGroup>
                  {(tags ?? []).map((t) => {
                    const isSelected = value.includes(t.id);
                    return (
                      <CommandItem
                        key={t.id}
                        value={t.name}
                        onSelect={() =>
                          onChange(
                            isSelected ? value.filter((id) => id !== t.id) : [...value, t.id],
                          )
                        }
                      >
                        {t.name}
                        {isSelected && <Check className="ml-auto" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {mayCreate &&
                  search.trim().length >= 2 &&
                  !(tags ?? []).some(
                    (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
                  ) && (
                    <CommandGroup heading="Create">
                      <CommandItem
                        value={`__create__${search.trim()}`}
                        onSelect={() => void createTag(search.trim())}
                      >
                        <Plus /> Buat tag “{search.trim()}”
                      </CommandItem>
                    </CommandGroup>
                  )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
