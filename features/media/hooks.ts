"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaApi } from "@/lib/api/media";
import type { PresignInput } from "@/lib/api/media";
import { toast } from "sonner";

export const mediaKeys = { all: ["media"] as const };

/**
 * Backend belum punya GET /media (list) — lihat README "Backend contract gaps".
 * CMS menyimpan indeks media lokal (localStorage) hasil upload, supaya
 * Media Library & Media Picker tetap berfungsi penuh di MVP. Metadata
 * kanonik tetap di PostgreSQL backend; cache ini hanya daftar ID/URL milik
 * user ini di browser.
 */
const LS_KEY = "kk_cm…index";

export function getLocalMediaIndex(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addToLocalMediaIndex(id: string): void {
  const ids = getLocalMediaIndex();
  if (!ids.includes(id)) {
    window.localStorage.setItem(LS_KEY, JSON.stringify([id, ...ids].slice(0, 500)));
  }
}

/** Dipakai alur upload custom (dropzone media & cover) agar indeks lokal ikut ter-update. */
export function recordUploadedMedia(media: { id: string }): void {
  addToLocalMediaIndex(media.id);
}

export function useMediaList() {
  return useQuery({
    queryKey: [...mediaKeys.all, "index"],
    queryFn: async () => {
      const ids = getLocalMediaIndex();
      const results = await Promise.allSettled(ids.map((id) => mediaApi.get(id)));
      return results
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof mediaApi.get>>> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
    },
  });
}

/** Ambil satu media by id (dipakai preview cover di form artikel). */
export function useMedia(id: string | null | undefined) {
  return useQuery({
    queryKey: [...mediaKeys.all, "detail", id],
    queryFn: () => mediaApi.get(id!),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder?: PresignInput["folder"] }) =>
      mediaApi.upload(file, folder),
    onSuccess: (media) => {
      addToLocalMediaIndex(media.id);
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success("Media berhasil diunggah");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Gagal mengunggah media"),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.remove(id),
    onSuccess: (_data, id) => {
      const ids = getLocalMediaIndex().filter((x) => x !== id);
      window.localStorage.setItem(LS_KEY, JSON.stringify(ids));
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      toast.success("Media dihapus");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Gagal menghapus media"),
  });
}
