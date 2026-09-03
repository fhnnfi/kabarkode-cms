"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api/articles";
import type { ArticleListQuery } from "@/types/models";
import { toast } from "sonner";
import type { NormalizedApiError } from "@/types/api";

export const articleKeys = {
  all: ["articles"] as const,
  list: (q: ArticleListQuery) => ["articles", "list", q] as const,
  detail: (id: string) => ["articles", "detail", id] as const,
};

export function useArticles(query: ArticleListQuery) {
  return useQuery({
    queryKey: articleKeys.list(query),
    queryFn: () => articlesApi.listAll(query),
    placeholderData: (prev) => prev,
  });
}

export function useArticle(id: string | null) {
  return useQuery({
    queryKey: articleKeys.detail(id ?? ""),
    queryFn: async () => {
      try {
        return await articlesApi.get(id!);
      } catch (err) {
        // Gap backend: GET /articles/:id publik dan 404 untuk draft/archived.
        // Fallback lewat endpoint staff /articles/admin/all (requirement redesign
        // §81 melarang ubah backend tanpa perlu).
        if ((err as { status?: number })?.status === 404) {
          for (let page = 1; page <= 5; page++) {
            const res = await articlesApi.listAll({ limit: 100, page });
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
