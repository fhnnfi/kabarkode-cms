"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaPicker } from "@/components/media/media-picker";
import { EmptyState } from "@/components/brand/empty-state";
import { slugify } from "@/lib/utils/slug";
import { articlesApi } from "@/lib/api/articles";
import { useAuthorCrud, useAuthors } from "@/features/taxonomy/hooks";
import { useMedia } from "@/features/media/hooks";
import { authorFormSchema, type AuthorFormValues } from "@/lib/validation/schemas";
import type { Author } from "@/types/models";

/**
 * Authors (redesign §51): profile cards, bukan tabel padat. Jumlah artikel
 * per author diambil dari meta.total (backend belum punya endpoint stats).
 */
export default function AuthorsPage() {
  const { data: authors, isLoading, isError, refetch } = useAuthors();
  const crud = useAuthorCrud();
  const [editing, setEditing] = useState<Author | null>(null);
  const [deleting, setDeleting] = useState<Author | null>(null);
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: { name: "", slug: "", bio: "", avatar_media_id: null, email: "", password: "" },
  });

  const avatarId = form.watch("avatar_media_id");
  const { data: avatarMedia } = useMedia(avatarId);

  function startCreate() {
    setEditing(null);
    form.reset({ name: "", slug: "", bio: "", avatar_media_id: null, email: "", password: "" });
    setOpen(true);
  }

  function startEdit(a: Author) {
    setEditing(a);
    form.reset({
      name: a.name,
      slug: a.slug,
      bio: a.bio ?? "",
      avatar_media_id: a.avatar_media_id,
      email: a.email ?? "",
      password: "",
    });
    setOpen(true);
  }

  function onSubmit(values: AuthorFormValues) {
    const body: Record<string, unknown> = {
      name: values.name.trim(),
      slug: values.slug?.trim() || slugify(values.name),
      bio: values.bio?.trim() || null,
      avatar_media_id: values.avatar_media_id ?? null,
    };
    if (values.email?.trim()) body.email = values.email.trim();
    if (values.password) body.password = values.password;
    if (editing) {
      crud.update.mutate({ id: editing.id, body }, { onSuccess: () => setOpen(false) });
    } else {
      crud.create.mutate(body, { onSuccess: () => setOpen(false) });
    }
  }

  const busy = crud.create.isPending || crud.update.isPending;
  const filtered = (authors ?? []).filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
          <p className="text-sm text-muted-foreground">Profil penulis KabarKode.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus /> New Author
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari author…"
          className="bg-card pl-8"
          aria-label="Cari author"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card py-10 text-center text-sm text-destructive">
          Gagal memuat authors.{" "}
          <Button variant="link" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AuthorCard
              key={a.id}
              author={a}
              onEdit={() => startEdit(a)}
              onDelete={() => setDeleting(a)}
            />
          ))}
        </div>
      ) : authors && authors.length > 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
          Tidak ada author yang cocok dengan pencarian.
        </div>
      ) : (
        <EmptyState
          title="Belum ada author."
          description="Tulis profil orang-orang di balik cerita KabarKode."
          actionLabel="Buat author pertama"
          onAction={startCreate}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Author" : "Author Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                {avatarMedia && <AvatarImage src={avatarMedia.public_url} alt="Avatar" />}
                <AvatarFallback>{form.watch("name")?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setAvatarOpen(true)}>
                  Pilih Avatar
                </Button>
                {avatarId && (
                  <p className="font-mono text-xs text-muted-foreground">
                    avatar: media {avatarId.slice(0, 8)}…
                  </p>
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
              <Input id="author-slug" className="font-mono text-sm" placeholder="kosongkan = otomatis" {...form.register("slug")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author-bio">Bio</Label>
              <Textarea id="author-bio" rows={3} {...form.register("bio")} />
            </div>
            {/* Akun login (role author) — dibuat saat create dengan email+password. */}
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-3">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {editing ? "Akun login" : "Akun sign-in (opsional)"}
              </p>
              <div className="grid gap-2">
                <Label htmlFor="author-email">Email</Label>
                <Input
                  id="author-email"
                  type="email"
                  placeholder="penulis@example.com"
                  disabled={Boolean(editing?.user_id)}
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
                {editing?.user_id && (
                  <p className="text-xs text-muted-foreground">
                    Email tidak bisa diubah. Isi password saja untuk reset.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="author-password">Password</Label>
                <Input
                  id="author-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={editing?.user_id ? "kosongkan = tidak diganti" : "min. 8 karakter"}
                  aria-invalid={Boolean(form.formState.errors.password)}
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
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
              Hapus author
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuthorCard({
  author,
  onEdit,
  onDelete,
}: {
  author: Author;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = useQuery({
    queryKey: ["stats", "author", author.slug],
    queryFn: () => articlesApi.listAll({ author: author.slug, limit: 1 }),
    staleTime: 60_000,
  });
  return (
    <div className="kk-transition group/author rounded-2xl border bg-card p-5 text-center hover:border-foreground/25 hover:shadow-sm">
      <Avatar className="mx-auto size-16">
        <AvatarFallback className="bg-black text-lg text-white">
          {author.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p className="mt-3 truncate text-sm font-bold tracking-tight">{author.name}</p>
      <p className="font-mono text-xs text-muted-foreground">@{author.slug}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {count.data ? `${count.data.meta.total} artikel` : "…"}
      </p>
      <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
        {author.email ? (
          <span className="kk-transition inline-flex items-center gap-1 rounded-full bg-brand/20 px-2 py-0.5 text-black">
            <span className="size-1.5 rounded-full bg-brand ring-1 ring-black/10" />
            {author.email}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
            tanpa akun login
          </span>
        )}
      </p>
      <div className="mt-3 flex justify-center gap-1">
        <Button variant="ghost" size="sm" asChild className="kk-transition gap-1 text-xs">
          <Link href={`/articles?author=${author.slug}`}>
            View articles →
          </Link>
        </Button>
      </div>
      <div className="mt-1 flex justify-center gap-1 opacity-0 transition-opacity group-hover/author:opacity-100 focus-within:opacity-100">
        <Button variant="ghost" size="icon" className="size-7" aria-label={`Edit ${author.name}`} onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" aria-label={`Hapus ${author.name}`} onClick={onDelete}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
