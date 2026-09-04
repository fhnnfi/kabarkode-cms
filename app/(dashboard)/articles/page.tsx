"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useArticles } from "@/features/articles/hooks";
import { ArticleList } from "@/features/articles/components/article-list";
import { EmptyState } from "@/components/brand/empty-state";
import { STATUS_OPTIONS, ARTICLE_TYPE_OPTIONS } from "@/features/articles/status-config";
import { useCategories, useAuthors, useTags } from "@/features/taxonomy/hooks";
import { cn } from "@/lib/utils";
import type { ArticleListQuery } from "@/types/models";

/**
 * Articles workspace (redesign §18–§19): tabs status menggantikan dropdown
 * status, filter lanjutan di dalam popover, state filter persist di URL (§78).
 */
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
      tag: params.get("tag") ?? undefined,
    }),
    [params],
  );

  const [searchInput, setSearchInput] = useState(query.search ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useArticles(query);
  const categories = useCategories();
  const authors = useAuthors();
  const tags = useTags();

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
  const advancedFilters = Boolean(query.article_type || query.category || query.author || query.tag);
  const activeCount = [query.article_type, query.category, query.author, query.tag].filter(Boolean).length;
  const categoryName = categories.data?.find((c) => c.slug === query.category)?.name;
  const authorName = authors.data?.find((a) => a.slug === query.author)?.name;
  const tagName = tags.data?.find((t) => t.slug === query.tag)?.name;
  const typeName = ARTICLE_TYPE_OPTIONS.find((t) => t.value === query.article_type)?.label;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
          <p className="text-sm text-muted-foreground">
            Kelola cerita dan alur publikasi KabarKode.
          </p>
        </div>
        <Button asChild>
          <Link href="/articles/new">
            <Plus /> New Article
          </Link>
        </Button>
      </div>

      {/* Search + Filters (§19) */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-56 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ search: searchInput.trim() || undefined });
          }}
        >
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul / slug / excerpt…"
            className="bg-card pl-8"
            aria-label="Cari artikel"
          />
        </form>
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="kk-transition gap-2 bg-card">
              <SlidersHorizontal /> Filters
              {activeCount > 0 && (
                <Badge className="rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 rounded-xl p-4">
            <p className="mb-3 text-sm font-semibold">Filters</p>

            <Label className="text-xs text-muted-foreground">Category</Label>
            <CategoryAuthorPicker
              placeholder="Search category…"
              options={(categories.data ?? []).map((c) => ({ value: c.slug, label: c.name }))}
              value={query.category}
              onChange={(v) => setParam({ category: v })}
            />

            <Label className="mt-3 block text-xs text-muted-foreground">Author</Label>
            <CategoryAuthorPicker
              placeholder="Search author…"
              options={(authors.data ?? []).map((a) => ({ value: a.slug, label: a.name }))}
              value={query.author}
              onChange={(v) => setParam({ author: v })}
            />

            <Label className="mt-3 block text-xs text-muted-foreground">Article Type</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ARTICLE_TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() =>
                    setParam({ article_type: query.article_type === o.value ? undefined : o.value })
                  }
                  className={cn(
                    "kk-transition rounded-lg border px-2.5 py-1 text-xs font-medium",
                    query.article_type === o.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card hover:border-foreground/30",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setParam({ article_type: undefined, category: undefined, author: undefined, tag: undefined });
                  setFiltersOpen(false);
                }}
              >
                Reset
              </Button>
              <Button size="sm" onClick={() => setFiltersOpen(false)}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Chips filter aktif */}
      {(categoryName || authorName || typeName || tagName) && (
        <div className="flex flex-wrap gap-1.5">
          {[typeName, categoryName && `Kategori: ${categoryName}`, authorName && `Author: ${authorName}`, tagName && `Tag: ${tagName}`]
            .filter(Boolean)
            .map((chip) => (
              <Badge key={chip} variant="secondary" className="gap-1 rounded-full pr-1">
                {chip}
                <button
                  type="button"
                  aria-label={`Hapus filter ${chip}`}
                  className="kk-transition rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={() =>
                    setParam({
                      article_type: chip === typeName ? undefined : query.article_type,
                      category: chip === `Kategori: ${categoryName}` ? undefined : query.category,
                      author: chip === `Author: ${authorName}` ? undefined : query.author,
                      tag: chip === `Tag: ${tagName}` ? undefined : query.tag,
                    })
                  }
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}

      {/* Tabs status menggantikan dropdown status (§18) */}
      <Tabs
        value={query.status ?? "all"}
        onValueChange={(v) => setParam({ status: v === "all" ? undefined : v })}
      >
        <TabsList className="kk-transition h-9 rounded-lg bg-card">
          <TabsTrigger value="all" className="rounded-md">All</TabsTrigger>
          {STATUS_OPTIONS.map((o) => (
            <TabsTrigger key={o.value} value={o.value} className="rounded-md">
              {o.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border bg-card py-12 text-center text-sm">
          <p className="font-medium">Something went wrong.</p>
          <p className="mt-1 text-muted-foreground">Kami tidak bisa memuat artikelmu.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        query.search || query.status || advancedFilters ? (
          <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
            Tidak ada artikel yang cocok.{" "}
            <button
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => {
                setSearchInput("");
                setParam({ search: undefined, status: undefined, article_type: undefined, category: undefined, author: undefined, tag: undefined });
              }}
            >
              Reset pencarian & filter
            </button>
          </div>
        ) : (
          <EmptyState
            title="Belum ada artikel."
            description="Cerita pertamamu dimulai di sini."
            actionLabel="Create Article"
            actionHref="/articles/new"
          />
        )
      ) : (
        <>
          <ArticleList articles={data!.items} />
          {meta && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="font-mono text-xs">
                {meta.page}/{Math.max(1, meta.totalPages)} · {meta.total} artikel
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

/** Picker searchable untuk kategori/author di dalam popover filter (§19). */
function CategoryAuthorPicker({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Command className="mt-1.5 rounded-lg border">
      <CommandInput placeholder={placeholder} className="h-8" />
      <CommandList className="max-h-40">
        <CommandEmpty>Tidak ada.</CommandEmpty>
        <CommandGroup>
          <CommandItem
            value="__all__"
            onSelect={() => onChange(undefined)}
            className={cn(!value && "bg-accent")}
          >
            Semua
          </CommandItem>
          {options.map((o) => (
            <CommandItem
              key={o.value}
              value={o.label}
              onSelect={() => onChange(o.value)}
              className={cn(value === o.value && "bg-accent")}
            >
              {o.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
