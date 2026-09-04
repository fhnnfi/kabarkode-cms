"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api/articles";
import type { ArticleListQuery } from "@/types/models";
import { toast } from "sonner";
import type { NormalizedApiError } from "@/types/api";
import { useAuth } from "@/features/auth/auth-provider";

export const articleKeys = {
  all: ["articles"] as const,
  list: (q: ArticleListQuery) => ["articles", "list", q] as const,
  detail: (id: string) => ["articles", "detail", id] as const,
};

/**
 * Fetcher daftar artikel sesuai role: staff (admin/editor) memakai
 * /articles/admin/all; role author memakai /articles/mine (scoping
 * server-side ke profil tertautnya).
 */
export function useArticlesFetcher() {
  const { user } = useAuth();
  const isAuthor = user?.role === "author";
  return (query: ArticleListQuery) =>
    isAuthor ? articlesApi.listMine(query) : articlesApi.listAll(query);
}

export function useArticles(query: ArticleListQuery) {
  const fetcher = useArticlesFetcher();
  return useQuery({
    queryKey: articleKeys.list(query),
    queryFn: () => fetcher(query),
    placeholderData: (prev) => prev,
  });
}

export function useArticle(id: string | null) {
  const { user } = useAuth();
  const isAuthor = user?.role === "author";
  return useQuery({
    queryKey: articleKeys.detail(id ?? ""),
    queryFn: async () => {
      try {
        return await articlesApi.get(id!);
      } catch (err) {
        // Gap backend lama: GET /articles/:id publik menolak draft. Fallback
        // lewat list role-aware (admin/all untuk staff, /mine untuk author).
        if ((err as { status?: number })?.status === 404) {
          const fetcher = isAuthor ? articlesApi.listMine : articlesApi.listAll;
          for (let page = 1; page <= 5; page++) {
            const res = await fetcher({ limit: 100, page });
            const found = res.items.find((a) => a.id === id);
            if (found) return found;
            if (page >= Math.ceil(res.meta.total / 100)) break;
          }
        }
        throw err;
      }
    },
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

function invalidateAfterChange(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: articleKeys.all });
  if (id) qc.invalidateQueries({ queryKey: articleKeys.detail(id) });
}

function fail(action: string) {
  return (err: NormalizedApiError) => toast.error(err.message || `Gagal ${action}`);
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => articlesApi.create(body),
    onSuccess: () => {
      invalidateAfterChange(qc);
      toast.success("Artikel berhasil disimpan");
    },
    onError: fail("menyimpan artikel"),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      articlesApi.update(id, body),
    onSuccess: (article) => {
      invalidateAfterChange(qc, article.id);
      toast.success("Perubahan artikel tersimpan");
      return article;
    },
    onError: fail("menyimpan perubahan"),
  });
}

export function usePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articlesApi.publish(id),
    onSuccess: (article) => {
      invalidateAfterChange(qc, article.id);
      toast.success("Artikel berhasil dipublikasikan");
    },
    onError: fail("mempublikasikan"),
  });
}

/**
 * Jadwalkan publikasi otomatis (scheduled_at ISO; null = batalkan jadwal).
 * Backend mem-publish sendiri saat jatuh tempo — tidak perlu browser tetap terbuka.
 */
export function useScheduleArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string | null }) =>
      articlesApi.schedule(id, scheduledAt),
    onSuccess: (article) => {
      invalidateAfterChange(qc, article.id);
      toast.success(
        article.scheduled_at
          ? `Publikasi terjadwal: ${new Date(article.scheduled_at).toLocaleString("id-ID")}`
          : "Jadwal publikasi dibatalkan",
      );
    },
    onError: fail("menjadwalkan publikasi"),
  });
}

export function useArchiveArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articlesApi.archive(id),
    onSuccess: (article) => {
      invalidateAfterChange(qc, article.id);
      toast.success("Artikel diarsipkan");
    },
    onError: fail("mengarsipkan"),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => articlesApi.remove(id),
    onSuccess: () => {
      invalidateAfterChange(qc);
      toast.success("Artikel dihapus");
    },
    onError: fail("menghapus"),
  });
}
