"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/brand/empty-state";
import { slugify } from "@/lib/utils/slug";
import { useTagCrud, useTags } from "@/features/taxonomy/hooks";
import { tagFormSchema, type TagFormValues } from "@/lib/validation/schemas";
import type { Tag } from "@/types/models";

/**
 * Tags (redesign §50): chip compact; klik chip membuka pemakaian artikel
 * di halaman Articles lewat filter tag di URL.
 */
export default function TagsPage() {
  const { data: tags, isLoading, isError, refetch } = useTags();
  const crud = useTagCrud();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: "", slug: "" },
  });

  function startCreate() {
    setEditing(null);
    form.reset({ name: "", slug: "" });
    setOpen(true);
  }

  function startEdit(t: Tag) {
    setEditing(t);
    form.reset({ name: t.name, slug: t.slug });
    setOpen(true);
  }

  function onSubmit(values: TagFormValues) {
    const body = { name: values.name.trim(), slug: values.slug?.trim() || slugify(values.name) };
    if (editing) {
      crud.update.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) });
    } else {
      crud.create.mutate(body, { onSuccess: () => setOpen(false) });
    }
  }

  const busy = crud.create.isPending || crud.update.isPending;
  const filtered = (tags ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">Label bebas untuk artikel.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus /> New Tag
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari tag…"
          className="bg-card pl-8"
          aria-label="Cari tag"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card py-10 text-center text-sm text-destructive">
          Gagal memuat tag.{" "}
          <Button variant="link" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filtered.map((t) => (
            <span
              key={t.id}
              className="kk-transition group/tag flex items-center overflow-hidden rounded-full border bg-card py-1 pl-0 hover:border-foreground/30 hover:shadow-sm"
            >
              {/* Klik nama tag → lihat pemakaian artikel (§50) */}
              <Link
                href={`/articles?tag=${t.slug}`}
                className="kk-transition flex items-center gap-1.5 rounded-full bg-black py-1 pr-2 pl-3 text-sm font-medium text-white hover:bg-neutral-800"
                aria-label={`Lihat artikel dengan tag ${t.name}`}
              >
                {t.name}
                <span className="font-mono text-[10px] opacity-60">#{t.slug}</span>
              </Link>
              <span className="flex items-center gap-0.5 pl-1.5 pr-1.5 opacity-0 transition-opacity group-hover/tag:opacity-100 focus-within:opacity-100">
                <Button variant="ghost" size="icon" className="size-6" aria-label={`Edit tag ${t.name}`} onClick={() => startEdit(t)}>
                  <Pencil className="size-3" />
                </Button>
                <Button variant="ghost" size="icon" className="size-6" aria-label={`Hapus tag ${t.name}`} onClick={() => setDeleting(t)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </span>
            </span>
          ))}
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
          Tidak ada tag yang cocok dengan pencarian.
        </div>
      ) : (
        <EmptyState
          title="Belum ada tag."
          description="Tag membantu pembaca menemukan topik yang saling terkait."
          actionLabel="Buat tag pertama"
          onAction={startCreate}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tag" : "Tag Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tag-name">Nama</Label>
              <Input id="tag-name" {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input id="tag-slug" className="font-mono text-sm" placeholder="kosongkan = otomatis" {...form.register("slug")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus tag?</DialogTitle>
            <DialogDescription>“{deleting?.name}” akan dilepas dari semua artikel.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={crud.remove.isPending}
              onClick={() => deleting && crud.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
            >
              Hapus tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
