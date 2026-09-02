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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { MediaPicker } from "@/components/media/media-picker";
import { slugify } from "@/lib/utils/slug";
import { useAuthorCrud, useAuthors } from "@/features/taxonomy/hooks";
import { authorFormSchema, type AuthorFormValues } from "@/lib/validation/schemas";
import type { Author } from "@/types/models";

export default function AuthorsPage() {
  const { data: authors, isLoading, isError, refetch } = useAuthors();
  const crud = useAuthorCrud();
  const [editing, setEditing] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState<Author | null>(null);
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: { name: "", slug: "", bio: "", avatar_media_id: null },
  });

  const avatarId = form.watch("avatar_media_id");

  function startCreate() {
    setEditing(null);
    form.reset({ name: "", slug: "", bio: "", avatar_media_id: null });
    setOpen(true);
  }

  function startEdit(a: Author) {
    setEditing(a);
    form.reset({ name: a.name, slug: a.slug, bio: a.bio ?? "", avatar_media_id: a.avatar_media_id });
    setOpen(true);
  }

  function onSubmit(values: AuthorFormValues) {
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      slug: values.slug?.trim() || slugify(values.name),
      bio: values.bio?.trim() || null,
      avatar_media_id: values.avatar_media_id ?? null,
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
          <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
          <p className="text-sm text-muted-foreground">Profil penulis KabarKode.</p>
        </div>
        <Button onClick={startCreate}><Plus /> Author Baru</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : isError ? (
        <div className="rounded-lg border py-10 text-center text-sm text-destructive">
          Gagal memuat authors. <Button variant="link" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : authors && authors.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Avatar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden max-w-[300px] md:table-cell">Bio</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Avatar size="sm">
                      <AvatarFallback>{a.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="font-mono text-xs">{a.slug}</TableCell>
                  <TableCell className="hidden max-w-[300px] truncate text-muted-foreground md:table-cell">
                    {a.bio ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${a.name}`} onClick={() => startEdit(a)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Hapus ${a.name}`} onClick={() => setDeleting(a)}>
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
          Belum ada author. <Button variant="link" onClick={startCreate}>Buat author pertama</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Author" : "Author Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback>{form.watch("name")?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setAvatarOpen(true)}>
                  Pilih Avatar
                </Button>
                {avatarId && (
                  <p className="text-xs text-muted-foreground">Avatar terpilih (media id {avatarId.slice(0, 8)}…)</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author-name">Nama</Label>
              <Input id="author-name" {...form.register("name")} aria-invalid={Boolean(form.formState.errors.name)} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author-slug">Slug</Label>
              <Input id="author-slug" placeholder="kosongkan = otomatis" {...form.register("slug")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author-bio">Bio</Label>
              <Textarea id="author-bio" rows={3} {...form.register("bio")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MediaPicker
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        folder="authors"
        onSelect={(m) => {
          form.setValue("avatar_media_id", m.id);
          setAvatarOpen(false);
        }}
      />

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus author?</DialogTitle>
            <DialogDescription>“{deleting?.name}” akan dihapus dari sistem.</DialogDescription>
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
