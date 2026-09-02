"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { tagsApi } from "@/lib/api/tags";
import { authorsApi } from "@/lib/api/authors";
import { toast } from "sonner";
import type { NormalizedApiError } from "@/types/api";

/** Referensi data: staleTime panjang (requirement §61). */
const REF_STALE = 5 * 60_000;

export const taxonomyKeys = {
  categories: ["categories"] as const,
  tags: ["tags"] as const,
  authors: ["authors"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: taxonomyKeys.categories,
    queryFn: categoriesApi.list,
    staleTime: REF_STALE,
  });
}

export function useTags() {
  return useQuery({ queryKey: taxonomyKeys.tags, queryFn: tagsApi.list, staleTime: REF_STALE });
}

export function useAuthors() {
  return useQuery({ queryKey: taxonomyKeys.authors, queryFn: authorsApi.list, staleTime: REF_STALE });
}

interface CrudApi<T> {
  // Sintaks metode (bivariant) agar API bertipe body sempit tetap assignable.
  create(body: Record<string, unknown>): Promise<T>;
  update(id: string, body: Record<string, unknown>): Promise<T>;
  remove(id: string): Promise<void>;
}

function crudHooks<T>(key: readonly unknown[], api: CrudApi<T>, label: string) {
  return function useTaxonomyCrud() {
    const qc = useQueryClient();
    const onSettled = () => qc.invalidateQueries({ queryKey: key });
    const onError = (err: NormalizedApiError) => toast.error(err.message || `Gagal ${label}`);
    return {
      create: useMutation({
        mutationFn: (body: Record<string, unknown>) => api.create(body),
        onSuccess: () => toast.success(`${label} berhasil dibuat`),
        onSettled,
        onError,
      }),
      update: useMutation({
        mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
          api.update(id, body),
        onSuccess: () => toast.success(`${label} diperbarui`),
        onSettled,
        onError,
      }),
      remove: useMutation({
        mutationFn: (id: string) => api.remove(id),
        onSuccess: () => toast.success(`${label} dihapus`),
        onSettled,
        onError,
      }),
    };
  };
}

export const useCategoryCrud = crudHooks(taxonomyKeys.categories, categoriesApi, "Kategori");
export const useTagCrud = crudHooks(taxonomyKeys.tags, tagsApi, "Tag");
export const useAuthorCrud = crudHooks(taxonomyKeys.authors, authorsApi, "Author");
