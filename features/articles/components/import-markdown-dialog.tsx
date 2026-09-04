"use client";

import { useCallback, useRef, useState } from "react";
import { FileDown, ImageOff, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mediaApi } from "@/lib/api/media";
import { recordUploadedMedia } from "@/features/media/hooks";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { parseMarkdownArticle, publicationDateOf, type ParsedMarkdownArticle } from "@/lib/utils/markdown-import";
import { cn } from "@/lib/utils";

interface ImportMarkdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dipanggil dengan hasil parse + mediaId cover (bila berhasil di-import). */
  onApply: (parsed: ParsedMarkdownArticle, coverMediaId: string | null) => void;
}

/**
 * Import artikel dari berkas .md (format newscrap): judul H1, metadata
 * Penulis/Sumber/Tanggal, gambar pertama jadi cover (di-rehost ke Media
 * Library, bukan hotlink), body markdown -> rich text HTML.
 */
export function ImportMarkdownDialog({ open, onOpenChange, onApply }: ImportMarkdownDialogProps) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedMarkdownArticle | null>(null);
  const [pubDate, setPubDate] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setFileName("");
    setParsed(null);
    setPubDate(null);
    setBusy(false);
  }, []);

  const readFile = useCallback(async (file: File) => {
    if (!/\.(md|markdown)$/i.test(file.name)) {
      toast.error("Hanya berkas .md / .markdown yang didukung.");
      return;
    }
    try {
      const text = await file.text();
      const result = parseMarkdownArticle(text, file.name);
      setFileName(file.name);
      setParsed(result);
      setPubDate(publicationDateOf(text));
    } catch {
      toast.error("Gagal membaca berkas markdown.");
    }
  }, []);

  async function onConfirm() {
    if (!parsed) return;
    setBusy(true);
    let coverMediaId: string | null = null;
    if (parsed.cover_image_url) {
      try {
        // Re-host cover ke MinIO lewat route anti-SSRF + presigned flow normal.
        const res = await fetch(`/api/image-import?url=${encodeURIComponent(parsed.cover_image_url)}`);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const name = decodeURIComponent(res.headers.get("x-image-name") ?? "cover.jpg");
        const file = new File([blob], name, { type: blob.type });
        const media = await mediaApi.upload(file, "articles");
        recordUploadedMedia(media);
        coverMediaId = media.id;
      } catch {
        toast.warning("Cover gagal di-import — artikel tetap bisa disimpan, pilih cover manual.");
      }
    }
    onApply({ ...parsed, contentHtml: sanitizeHtml(parsed.contentHtml) }, coverMediaId);
    setBusy(false);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!busy) {
          onOpenChange(o);
          if (!o) reset();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="size-4" /> Import dari Markdown
          </DialogTitle>
          <DialogDescription>
            Unggah berkas .md — judul, isi, excerpt, sumber, dan cover akan terisi
            otomatis di editor. Anda tetap bisa mengedit sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Pilih atau jatuhkan berkas markdown"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void readFile(f);
            }}
            className={cn(
              "kk-transition flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            )}
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Klik atau seret berkas .md ke sini</p>
            <p className="text-xs text-muted-foreground">
              Format newscrap: judul H1, metadata Penulis/Sumber/Tanggal, gambar pertama = cover
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {fileName}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold">{parsed.title}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {parsed.excerpt}
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", parsed.source_url ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                Sumber: {parsed.source_name ?? "—"}
                {parsed.source_url && <span className="truncate font-mono">({parsed.source_url})</span>}
              </li>
              <li className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", parsed.cover_image_url ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                {parsed.cover_image_url ? (
                  <>Cover akan di-import: <span className="truncate font-mono">{parsed.cover_image_url}</span></>
                ) : (
                  <span className="flex items-center gap-1"><ImageOff className="size-3" /> Tidak ada gambar cover di dokumen</span>
                )}
              </li>
              {parsed.author_name && (
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                  Penulis tertulis: {parsed.author_name} — pilih author manual di sidebar
                </li>
              )}
              {pubDate && (
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" />
                  Tanggal publikasi sumber: {pubDate}
                </li>
              )}
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                ±{parsed.contentHtml.length.toLocaleString("id-ID")} karakter HTML siap edit
              </li>
            </ul>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Ganti berkas
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".md,.markdown,text/markdown"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={!parsed || busy}>
            {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
            {busy ? "Mengimpor…" : "Isikan ke editor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
