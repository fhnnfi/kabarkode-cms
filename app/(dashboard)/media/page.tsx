"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LayoutGrid, List, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/utils/format";
import { useDeleteMedia, useMediaList, useUploadMedia } from "@/features/media/hooks";
import type { Media } from "@/types/models";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function MediaPage() {
  const { data: mediaList, isLoading, isError, refetch } = useMediaList();
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [preview, setPreview] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = (mediaList ?? []).filter((m) =>
    m.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      alert(`Tipe file tidak didukung: ${file.type}. Gunakan JPG/PNG/WebP/AVIF.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("Ukuran file melebihi 10 MB.");
      return;
    }
    upload.mutate({ file });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground">
            Gambar diunggah ke MinIO via presigned URL, tampil lewat CDN.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Tampilan grid" className={cn(view === "grid" && "bg-muted")} onClick={() => setView("grid")}>
            <LayoutGrid />
          </Button>
          <Button variant="outline" size="icon" aria-label="Tampilan list" className={cn(view === "list" && "bg-muted")} onClick={() => setView("list")}>
            <List />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama file…"
          className="max-w-xs"
          aria-label="Cari media"
        />
        <Button onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          <Upload /> {upload.isPending ? "Mengunggah…" : "Unggah"}
        </Button>
        <input ref={fileRef} type="file" accept={ALLOWED.join(",")} className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : isError ? (
        <div className="rounded-lg border py-10 text-center text-sm text-destructive">
          Gagal memuat media. <Button variant="link" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
          {mediaList && mediaList.length === 0
            ? "Belum ada media. Klik “Unggah” untuk menambah gambar."
            : "Tidak ada media yang cocok dengan pencarian."}
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-lg border">
              <button type="button" className="block w-full" onClick={() => setPreview(m)} aria-label={`Preview ${m.file_name}`}>
                <div className="relative aspect-video bg-muted">
                  <Image src={m.public_url} alt={m.file_name} fill sizes="300px" className="object-cover" />
                </div>
              </button>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{m.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(m.size)}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-7" aria-label={`Hapus ${m.file_name}`} onClick={() => setDeleting(m)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Preview</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead className="hidden md:table-cell">Tipe</TableHead>
                <TableHead className="hidden lg:table-cell">Diunggah</TableHead>
                <TableHead className="w-16 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded bg-muted">
                      <Image src={m.public_url} alt="" fill sizes="40px" className="object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{m.file_name}</TableCell>
                  <TableCell>{formatBytes(m.size)}</TableCell>
                  <TableCell className="hidden md:table-cell">{m.mime_type}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(m.created_at, "d MMM yyyy HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label={`Hapus ${m.file_name}`} onClick={() => setDeleting(m)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview besar */}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          {preview && (
            <>
              <div className="relative max-h-[60vh] overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.public_url} alt={preview.file_name} className="mx-auto max-h-[60vh] w-auto" />
              </div>
              <p className="text-sm text-muted-foreground">
                {preview.file_name} · {formatBytes(preview.size)} · {preview.mime_type}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus media?</DialogTitle>
            <DialogDescription>
              “{deleting?.file_name}” akan dihapus permanen dari storage. Artikel yang memakainya akan kehilangan gambar ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
