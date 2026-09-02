"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, FolderTree, Images, Tags, UserPen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { articlesApi } from "@/lib/api/articles";
import { categoriesApi } from "@/lib/api/categories";
import { tagsApi } from "@/lib/api/tags";
import { authorsApi } from "@/lib/api/authors";
import { getLocalMediaIndex } from "@/features/media/hooks";
import { STATUS_CONFIG } from "@/features/articles/status-config";
import { formatDate } from "@/lib/utils/format";

/**
 * Backend belum punya endpoint statistik — dihitung dari meta.total
 * tiap query list (limit=1) agar hemat payload.
 */
function useCount(status: "draft" | "published" | "archived") {
  return useQuery({
    queryKey: ["stats", status],
    queryFn: () => articlesApi.listAll({ status, limit: 1 }),
    staleTime: 30_000,
  });
}

export default function DashboardPage() {
  const total = useQuery({
    queryKey: ["stats", "all"],
    queryFn: () => articlesApi.listAll({ limit: 1 }),
    staleTime: 30_000,
  });
  const published = useCount("published");
  const draft = useCount("draft");
  const archived = useCount("archived");

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const tags = useQuery({ queryKey: ["tags"], queryFn: tagsApi.list });
  const authors = useQuery({ queryKey: ["authors"], queryFn: authorsApi.list });

  const recent = useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: () => articlesApi.listAll({ limit: 6 }),
    staleTime: 30_000,
  });

  const stats = [
    { label: "Total Artikel", value: total.data?.meta.total, icon: FileText },
    { label: "Published", value: published.data?.meta.total, icon: FileText },
    { label: "Draft", value: draft.data?.meta.total, icon: FileText },
    { label: "Archived", value: archived.data?.meta.total, icon: FileText },
    { label: "Kategori", value: categories.data?.length, icon: FolderTree },
    { label: "Tag", value: tags.data?.length, icon: Tags },
    { label: "Authors", value: authors.data?.length, icon: UserPen },
    { label: "Media", value: getLocalMediaIndex().length, icon: Images },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan aktivitas redaksi KabarKode.</p>
        </div>
        <Button asChild>
          <Link href="/articles/new">Tulis Artikel</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <s.icon className="size-3.5" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.value === undefined ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold tabular-nums">{s.value}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artikel Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.isError ? (
            <div className="p-6 text-sm text-destructive">
              Gagal memuat artikel terbaru.{" "}
              <button className="underline" onClick={() => recent.refetch()}>
                Coba lagi
              </button>
            </div>
          ) : recent.data && recent.data.items.length > 0 ? (
            <ul>
              {recent.data.items.map((a) => (
                <li key={a.id} className="border-b last:border-0">
                  <Link
                    href={`/articles/${a.id}/edit`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</span>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {a.author?.name ?? "—"}
                    </span>
                    <span className="hidden text-xs text-muted-foreground md:block">
                      {formatDate(a.updated_at)}
                    </span>
                    <Badge variant={STATUS_CONFIG[a.status].variant} className={STATUS_CONFIG[a.status].className}>
                      {STATUS_CONFIG[a.status].label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada artikel.{" "}
              <Link href="/articles/new" className="text-primary underline">
                Buat artikel pertama KabarKode.
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
