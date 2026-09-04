"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  Check,
  Copy,
  Globe,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { EmptyState } from "@/components/brand/empty-state";
import { cn } from "@/lib/utils";
import { formatBytes, formatDate } from "@/lib/utils/format";
import { mediaApi } from "@/lib/api/media";
import { useDeleteMedia, useMediaList, recordUploadedMedia } from "@/features/media/hooks";
import { useAuth } from "@/features/auth/auth-provider";
import { toast } from "sonner";
import type { Media } from "@/types/models";

const MAX_SIZE = 10 * 1024 * 1024;

interface QueueItem {
  id: string;
  name: string;
  progress: number;
  state: "waiting" | "uploading" | "done" | "error";
}

/**
 * Media library sebagai visual asset manager (redesign §45–§48):
 * dropzone besar dengan queue upload berurutan (API presigned hanya
 * menerima satu file per request), grid kartu, dan panel detail dengan
 * copy URL.
 */
export default function MediaPage() {
  const { data: mediaList, isLoading, isError, refetch } = useMediaList();
  const del = useDeleteMedia();
  const { user } = useAuth();
  const mayDelete = user?.role === "admin" || user?.role === "editor";
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Media | null>(null);
  const [preview, setPreview] = useState<Media | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = (mediaList ?? []).filter((m) =>
    m.file_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Upload berurutan lewat presigned flow yang ada (§46).
  const uploadFiles = useCallback(
    async (files: File[]) => {
      const items: QueueItem[] = files.map((f, i) => ({
        id: `${Date.now()}-${i}`,
        name: f.name,
        progress: 0,
        state: "waiting",
      }));
      setQueue((q) => [...q, ...items]);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const item = items[i];
        setQueue((q) =>
          q.map((x) => (x.id === item.id ? { ...x, state: "uploading", progress: 10 } : x)),
        );
        try {
          const presign = await mediaApi.presign({
            file_name: file.name,
            mime_type: file.type,
            size: file.size,
            folder: "articles",
          });
          setQueue((q) =>
            q.map((x) => (x.id === item.id ? { ...x, progress: 40 } : x)),
          );
          await mediaApi.putToPresignedUrl(presign.uploadUrl, file, file.type);
          setQueue((q) =>
            q.map((x) => (x.id === item.id ? { ...x, progress: 85 } : x)),
          );
          const registered = await mediaApi.register({
            file_name: file.name,
            object_key: presign.objectKey,
            mime_type: file.type,
            size: file.size,
          });
          recordUploadedMedia(registered);
          setQueue((q) =>
            q.map((x) => (x.id === item.id ? { ...x, progress: 100, state: "done" } : x)),
          );
        } catch {
          setQueue((q) =>
            q.map((x) => (x.id === item.id ? { ...x, state: "error" } : x)),
          );
          toast.error(`Gagal mengunggah ${file.name}`);
        }
      }
      refetch();
      toast.success("Upload selesai");
      setTimeout(() => setQueue([]), 4000);
    },
    [refetch],
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: { file: { name: string } }[]) => {
      if (rejected.length > 0) {
        toast.error(
          `File ditolak: ${rejected.map((r) => r.file.name).join(", ")}. Gunakan JPG/PNG/WebP/AVIF maks 10 MB.`,
        );
      }
      if (accepted.length > 0) void uploadFiles(accepted);
    },
    [uploadFiles],
  );

  // Import gambar dari URL eksternal (Unsplash dkk.) — diunduh aman lewat
  // route /api/image-import lalu di-upload ke MinIO via presigned flow normal,
  // sehingga file tersimpan permanen (bukan hotlink).
  async function importFromUrl() {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/image-import?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Gagal mengambil gambar (${res.status})`);
      }
      const blob = await res.blob();
      const name = decodeURIComponent(res.headers.get("x-image-name") ?? "imported.jpg");
      const file = new File([blob], name, { type: blob.type });
      await uploadFiles([file]);
      setImportUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal import gambar");
    } finally {
      setImporting(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/avif": [] },
    maxSize: MAX_SIZE,
    multiple: true,
  });

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media</h1>
          <p className="text-sm text-muted-foreground">
            Kelola gambar dan aset artikel — upload ke MinIO via presigned URL, tampil lewat CDN.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Tampilan grid" className={cn("kk-transition bg-card", view === "grid" && "border-foreground/40 bg-accent")} onClick={() => setView("grid")}>
            <LayoutGrid />
          </Button>
          <Button variant="outline" size="icon" aria-label="Tampilan list" className={cn("kk-transition bg-card", view === "list" && "border-foreground/40 bg-accent")} onClick={() => setView("list")}>
            <List />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file…"
            className="bg-card pl-8"
            aria-label="Cari media"
          />
        </div>
      </div>

      {/* Dropzone besar (§46) */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Drop files here or click to browse files"
        className={cn(
          "kk-transition flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragActive ? "kk-dropzone-active border-brand" : "border-border bg-card/60 hover:border-foreground/25",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn("size-7", isDragActive ? "text-black" : "text-muted-foreground")} />
        <p className="text-sm font-semibold">
          {isDragActive ? "Drop files to upload" : "Drop files here"}
        </p>
        <p className="text-xs text-muted-foreground">or click to browse files</p>
        <p className="mt-1 font-mono text-[10px] tracking-wide text-muted-foreground">
          JPG · PNG · WEBP · AVIF — Maximum 10 MB per file
        </p>
      </div>

      {/* Import dari URL eksternal (Unsplash, CDN publik, dsb.) */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void importFromUrl();
        }}
      >
        <div className="relative max-w-md flex-1">
          <Globe className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Atau tempel URL gambar — mis. https://images.unsplash.com/photo-…"
            className="bg-card pl-8"
            aria-label="URL gambar eksternal"
          />
        </div>
        <Button type="submit" variant="outline" className="kk-transition bg-card" disabled={importing || !importUrl.trim()}>
          {importing ? <Loader2 className="animate-spin" /> : <Globe />} Import
        </Button>
      </form>

      {/* Upload queue (§47) */}
      {queue.length > 0 && (
        <div ref={listRef} className="space-y-2 rounded-xl border bg-card p-3">
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Uploads</p>
          {queue.map((q) => (
            <div key={q.id} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{q.name}</span>
              {q.state === "waiting" && (
                <span className="text-xs text-muted-foreground">Waiting…</span>
              )}
              {q.state === "uploading" && (
                <>
                  <div className="w-32">
                    <Progress value={q.progress} className="h-1.5" />
                  </div>
                  <span className="w-9 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {q.progress}%
                  </span>
                  <Loader2 className="size-3.5 animate-spin" />
                </>
              )}
              {q.state === "done" && <Check className="size-4 text-emerald-600" />}
              {q.state === "error" && <X className="size-4 text-destructive" />}
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card py-10 text-center text-sm text-destructive">
          Gagal memuat media. <Button variant="link" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : filtered.length === 0 ? (
        mediaList && mediaList.length === 0 ? (
          <EmptyState
            title="Belum ada media."
            description="Drop gambar di atas untuk mulai mengisi library."
          />
        ) : (
          <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
            Tidak ada media yang cocok dengan pencarian.
          </div>
        )
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <li
              key={m.id}
              className="kk-transition group/media overflow-hidden rounded-xl border bg-card hover:border-foreground/25 hover:shadow-sm"
            >
              <button type="button" className="block w-full" onClick={() => setPreview(m)} aria-label={`Preview ${m.file_name}`}>
                <div className="relative aspect-video bg-muted">
                  <Image src={m.public_url} alt={m.file_name} fill sizes="300px" className="object-cover transition-transform duration-200 group-hover/media:scale-[1.03]" />
                </div>
              </button>
              <div className="flex items-center gap-1 px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{m.file_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{formatBytes(m.size)}</p>
                </div>
                {mayDelete && (
                  <Button variant="ghost" size="icon" className="kk-transition size-7 opacity-0 group-hover/media:opacity-100" aria-label={`Hapus ${m.file_name}`} onClick={() => setDeleting(m)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border bg-card">
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
                <TableRow key={m.id} className="kk-transition cursor-pointer" onClick={() => setPreview(m)}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded bg-muted">
                      <Image src={m.public_url} alt="" fill sizes="40px" className="object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{m.file_name}</TableCell>
                  <TableCell>{formatBytes(m.size)}</TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{m.mime_type}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(m.created_at, "d MMM yyyy HH:mm")}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {mayDelete && (
                      <Button variant="ghost" size="icon" aria-label={`Hapus ${m.file_name}`} onClick={() => setDeleting(m)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Panel detail media (§48) */}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl rounded-2xl">
          {preview && (
            <>
              <DialogTitle className="sr-only">{preview.file_name}</DialogTitle>
              <div className="relative max-h-[55vh] overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.public_url} alt={preview.file_name} className="mx-auto max-h-[55vh] w-auto" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{preview.file_name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatBytes(preview.size)} · {preview.mime_type}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="min-w-0 flex-1 truncate rounded-lg border bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                    {preview.public_url}
                  </span>
                  <Button variant="outline" size="sm" className="kk-transition shrink-0 gap-1.5" onClick={() => copyUrl(preview.public_url)}>
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    Copy URL
                  </Button>
                  {mayDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => {
                        setDeleting(preview);
                        setPreview(null);
                      }}
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  )}
                </div>
              </div>
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
              “{deleting?.file_name}” akan dihapus permanen dari storage. Artikel yang memakainya
              akan kehilangan gambar ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={del.isPending}
              onClick={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
            >
              Hapus media
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
