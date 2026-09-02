"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils/slug";
import { formatDate } from "@/lib/utils/format";
import { useCategoryCrud, useCategories } from "@/features/taxonomy/hooks";
import { categoryFormSchema, type CategoryFormValues } from "@/lib/validation/schemas";
import type { Category } from "@/types/models";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const crud = useCategoryCrud();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kategori</h1>
          <p className="text-sm text-muted-foreground">Klasifikasi utama artikel KabarKode.</p>
        </div>
        <Button onClick={startCreate}><Plus /> Kategori Baru</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : isError ? (
        <div className="rounded-lg border py-10 text-center text-sm text-destructive">
          Gagal memuat kategori. <Button variant="link" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                  <TableCell className="hidden max-w-[300px] truncate text-muted-foreground md:table-cell">
                    {c.description ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {formatDate(c.created_at, "d MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${c.name}`} onClick={() => startEdit(c)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Hapus ${c.name}`} onClick={() => setDeleting(c)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
          Belum ada kategori.{" "}
          <Button variant="link" onClick={startCreate}>Buat kategori pertama</Button>
        </div>
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
              <Input id="cat-slug" placeholder="kosongkan = otomatis" {...form.register("slug")} />
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
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
