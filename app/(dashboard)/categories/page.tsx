"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDate } from "@/lib/utils/format";
import { useCategoryCrud, useCategories } from "@/features/taxonomy/hooks";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation/schemas";
import type { Category } from "@/types/models";

/**
 * Categories (redesign §49): bukan tabel CRUD generik — list editorial
 * dengan jumlah artikel per kategori, search inline, side-dialog create/edit.
 */
export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const crud = useCategoryCrud();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  function startCreate() {
    setEditing(null);
    form.reset({ name: "", slug: "", description: "" });
    setOpen(true);
  }

  function startEdit(c: Category) {
    setEditing(c);
    form.reset({ name: c.name, slug: c.slug, description: c.description ?? "" });
    setOpen(true);
  }

  function onSubmit(values: CategoryFormValues) {
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      slug: values.slug?.trim() || slugify(values.name),
      description: values.description?.trim() || null,
    };
    if (editing) {
      crud.update.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) });
    } else {
      crud.create.mutate(body, { onSuccess: () => setOpen(false) });
    }
  }

  const busy = crud.create.isPending || crud.update.isPending;
  const filtered = (categories ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your editorial content.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus /> New Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kategori…"
          className="bg-card pl-8"
          aria-label="Cari kategori"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card py-10 text-center text-sm text-destructive">
          Gagal memuat kategori.{" "}
          <Button variant="link" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="kk-transition group flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/articles?category=${c.slug}`}
                  className="kk-transition block truncate text-sm font-semibold tracking-tight hover:underline"
                >
                  {c.name}
                </Link>
                <p className="truncate font-mono text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {formatDate(c.created_at, "d MMM yyyy")}
              </span>
              <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${c.name}`} onClick={() => startEdit(c)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Hapus ${c.name}`} onClick={() => setDeleting(c)}>
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : categories && categories.length > 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
          Tidak ada kategori yang cocok dengan pencarian.
        </div>
      ) : (
        <EmptyState
          title="Belum ada kategori."
          description="Kategori membantu pembaca menjelajahi topik KabarKode."
          actionLabel="Buat kategori pertama"
          onAction={startCreate}
        />
      )}

      {/* Dialog create/edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Kategori" : "Kategori Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Nama</Label>
              <Input id="cat-name" {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" className="font-mono text-sm" placeholder="kosongkan = otomatis" {...form.register("slug")} />
              {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Deskripsi</Label>
              <Textarea id="cat-desc" rows={3} {...form.register("description")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kategori?</DialogTitle>
            <DialogDescription>
              “{deleting?.name}” akan dihapus. Artikel yang memakai kategori ini akan kehilangan kategorinya.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={crud.remove.isPending}
              onClick={() => deleting && crud.remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
            >
              Hapus kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
