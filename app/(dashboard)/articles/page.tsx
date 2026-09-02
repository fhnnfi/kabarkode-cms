"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArticles } from "@/features/articles/hooks";
import { ArticleTable } from "@/features/articles/components/article-table";
import { STATUS_OPTIONS, ARTICLE_TYPE_OPTIONS } from "@/features/articles/status-config";
import { useCategories, useAuthors } from "@/features/taxonomy/hooks";
import type { ArticleListQuery } from "@/types/models";

const ALL = "__all__";

export default function ArticlesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = useMemo<ArticleListQuery>(
    () => ({
      page: Math.max(1, Number(params.get("page") ?? 1) || 1),
      limit: 20,
      search: params.get("search") ?? undefined,
      status: (params.get("status") ?? undefined) as ArticleListQuery["status"],
      article_type: (params.get("type") ?? undefined) as ArticleListQuery["article_type"],
      category: params.get("category") ?? undefined,
      author: params.get("author") ?? undefined,
    }),
    [params],
  );

  const [searchInput, setSearchInput] = useState(query.search ?? "");
  const { data, isLoading, isError, refetch } = useArticles(query);
  const categories = useCategories();
  const authors = useAuthors();

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in updates)) next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, router, pathname],
  );

  const meta = data?.meta;
  const hasFilters = Boolean(query.search || query.status || query.article_type || query.category || query.author);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Artikel</h1>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh konten KabarKode — server-side search, filter, dan pagination.
          </p>
        </div>
        <Button asChild>
          <Link href="/articles/new">
            <Plus /> Artikel Baru
          </Link>
        </Button>
      </div>

      {/* Filter bar — state di URL agar bisa dibagikan/di-bookmark (§52) */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ search: searchInput.trim() || undefined });
          }}
        >
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul / konten (min. 2 karakter)…"
            className="w-64 pl-8"
            aria-label="Cari artikel"
          />
        </form>
        <Select value={query.status ?? ALL} onValueChange={(v) => setParam({ status: v === ALL ? undefined : v })}>
          <SelectTrigger className="w-36" aria-label="Filter status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={query.article_type ?? ALL} onValueChange={(v) => setParam({ article_type: v === ALL ? undefined : v })}>
          <SelectTrigger className="w-36" aria-label="Filter tipe"><SelectValue placeholder="Tipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua tipe</SelectItem>
            {ARTICLE_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={query.category ?? ALL} onValueChange={(v) => setParam({ category: v === ALL ? undefined : v })}>
          <SelectTrigger className="w-44" aria-label="Filter kategori"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kategori</SelectItem>
            {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={query.author ?? ALL} onValueChange={(v) => setParam({ author: v === ALL ? undefined : v })}>
          <SelectTrigger className="w-44" aria-label="Filter author"><SelectValue placeholder="Author" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua author</SelectItem>
            {(authors.data ?? []).map((a) => <SelectItem key={a.id} value={a.slug}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearchInput(""); setParam({ search: undefined, status: undefined, article_type: undefined, category: undefined, author: undefined }); }}>
            Reset
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <div className="rounded-lg border py-12 text-center text-sm">
          <p className="text-destructive">Gagal memuat artikel.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Coba lagi</Button>
        </div>
      ) : (
        <>
          <ArticleTable articles={data?.items ?? []} />
          {meta && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Halaman {meta.page} dari {Math.max(1, meta.totalPages)} · {meta.total} artikel
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setParam({ page: String(meta.page - 1) })}
                >
                  <ChevronLeft /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setParam({ page: String(meta.page + 1) })}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
