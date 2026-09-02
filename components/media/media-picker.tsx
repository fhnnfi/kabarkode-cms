"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaList, useUploadMedia } from "@/features/media/hooks";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { Media } from "@/types/models";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024; // selaras MAX_MEDIA_SIZE backend (10 MB)

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: Media) => void;
  folder?: "articles" | "authors" | "assets";
}

/** Dialog pilih/unggah media (requirement §65). */
export function MediaPicker({ open, onOpenChange, onSelect, folder = "articles" }: MediaPickerProps) {
  const { data: mediaList, isLoading } = useMediaList();
  const upload = useUploadMedia();
  const [search, setSearch] = useState("");
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
    upload.mutate(
      { file, folder },
      { onSuccess: (media) => onSelect(media) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih Media</DialogTitle>
          <DialogDescription>Pilih dari media yang sudah ada atau unggah baru.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file…"
            aria-label="Cari media"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload /> {upload.isPending ? "Mengunggah…" : "Unggah"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-video" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada media. Klik “Unggah” untuk menambah gambar baru.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m)}
                    className={cn(
                      "group w-full overflow-hidden rounded-md border text-left hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={m.public_url}
                        alt={m.file_name}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute right-1 top-1 hidden rounded bg-primary p-0.5 text-primary-foreground group-hover:block">
                        <Check className="size-3.5" />
                      </span>
                    </div>
                    <div className="truncate px-2 py-1 text-xs">
                      {m.file_name} · {formatBytes(m.size)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
