"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils/slug";
import { useTagCrud, useTags } from "@/features/taxonomy/hooks";
import { tagFormSchema, type TagFormValues } from "@/lib/validation/schemas";
import type { Tag } from "@/types/models";

export default function TagsPage() {
  const { data: tags, isLoading, isError, refetch } = useTags();
  const crud = useTagCrud();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tag</h1>
          <p className="text-sm text-muted-foreground">Label bebas untuk artikel.</p>
        </div>
        <Button onClick={startCreate}><Plus /> Tag Baru</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}</div>
      ) : isError ? (
        <div className="rounded-lg border py-10 text-center text-sm text-destructive">
          Gagal memuat tag. <Button variant="link" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-1 rounded-full border py-1 pr-1 pl-3">
              <Badge variant="secondary" className="rounded-full">{t.name}</Badge>
              <Button variant="ghost" size="icon" className="size-6" aria-label={`Edit tag ${t.name}`} onClick={() => startEdit(t)}>
                <Pencil className="size-3" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" aria-label={`Hapus tag ${t.name}`} onClick={() => setDeleting(t)}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
          Belum ada tag. <Button variant="link" onClick={startCreate}>Buat tag pertama</Button>
        </div>
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
              <Input id="tag-slug" placeholder="kosongkan = otomatis" {...form.register("slug")} />
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
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
