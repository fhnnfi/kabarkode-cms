"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Check, ImageOff, Loader2, Replace, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mediaApi } from "@/lib/api/media";
import { useMedia } from "@/features/media/hooks";

const MAX_SIZE = 10 * 1024 * 1024; // selaras MAX_MEDIA_SIZE backend (10 MB)

type Phase = "idle" | "uploading" | "done" | "error";

/**
 * Cover image dropzone (redesign §27–§31): drag & drop + click-to-browse
 * (fallback keyboard selalu tersedia), progress, preview, replace/remove,
 * plus pilih dari Media Library.
 */
export function CoverDropzone({
  mediaId,
  onChange,
}: {
  mediaId: string | null;
  onChange: (id: string | null) => void;
}) {
  const { data: media } = useMedia(mediaId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");

  const upload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setPhase("uploading");
      setProgress(10);
      try {
        // Presigned flow 3 langkah (lib/api/media) — progress disimulasikan
        // per tahap karena PUT presigned tidak mengirim event progres lewat proxy.
        const presign = await mediaApi.presign({
          file_name: file.name,
          mime_type: file.type,
          size: file.size,
          folder: "articles",
        });
        setProgress(35);
        await mediaApi.putToPresignedUrl(presign.uploadUrl, file, file.type);
        setProgress(80);
        const registered = await mediaApi.register({
          file_name: file.name,
          object_key: presign.objectKey,
          mime_type: file.type,
          size: file.size,
        });
        setProgress(100);
        onChange(registered.id);
        setPhase("done");
        toast.success("Cover berhasil diunggah");
      } catch {
        setPhase("error");
        toast.error("Gagal mengunggah cover. Coba lagi.");
      }
    },
    [onChange],
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: unknown[]) => {
      if (rejected.length > 0) {
        toast.error("File ditolak: gunakan JPG/PNG/WebP/AVIF maksimal 10 MB.");
        return;
      }
      const file = accepted[0];
      if (file) void upload(file);
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/avif": [],
    },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: phase === "uploading",
  });

  if (media && phase !== "uploading") {
    // Uploaded state (§30): aksi muncul saat hover/focus.
    return (
      <div className="group/cover relative aspect-video overflow-hidden rounded-xl border bg-muted">
        <Image src={media.public_url} alt="Cover artikel" fill sizes="320px" className="object-cover" />
        <div className="kk-transition absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 group-hover/cover:opacity-100 focus-within:opacity-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPhase("idle")}
          >
            <Replace className="size-3" /> Replace
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onChange(null);
              setPhase("idle");
            }}
          >
            <Trash2 className="size-3" /> Remove
          </Button>
        </div>
        <span className="absolute left-2 top-2 hidden rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-black group-hover/cover:inline-flex">
          <Check className="mr-0.5 size-2.5" /> uploaded
        </span>
      </div>
    );
  }

  if (phase === "uploading") {
    // Upload state (§29).
    return (
      <div className="space-y-2 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{fileName}</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "kk-transition flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragActive
          ? "kk-dropzone-active border-brand"
          : phase === "error"
            ? "border-destructive/50 bg-destructive/5"
            : "border-border bg-card hover:border-foreground/25",
      )}
      role="button"
      tabIndex={0}
      aria-label="Drop cover image here or click to browse"
    >
      <input {...getInputProps()} />
      {phase === "error" ? (
        <>
          <ImageOff className="size-6 text-destructive" />
          <p className="text-sm font-medium text-destructive">Upload gagal.</p>
          <p className="text-xs text-muted-foreground">Drop ulang atau klik untuk coba lagi.</p>
        </>
      ) : (
        <>
          <UploadCloud className={cn("size-6", isDragActive ? "text-brand-foreground" : "text-muted-foreground")} />
          <p className="text-sm font-semibold">
            {isDragActive ? "Drop image to upload" : "Drop cover image here"}
          </p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground">
            JPG · PNG · WEBP · AVIF · Max 10MB
          </p>
        </>
      )}
    </div>
  );
}
