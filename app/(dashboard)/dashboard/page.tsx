"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/brand/empty-state";
import { articlesApi } from "@/lib/api/articles";
import { STATUS_CONFIG } from "@/features/articles/status-config";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { formatRelative } from "@/lib/utils/format";

/**
 * Backend belum punya endpoint statistik — dihitung dari meta.total
 * tiap query list (limit=1) agar hemat payload.
 */
function useCount(status?: "draft" | "published" | "archived") {
  return useQuery({
    queryKey: ["stats", status ?? "all"],
    queryFn: () => articlesApi.listAll({ status, limit: 1 }),
    staleTime: 30_000,
  });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const total = useCount();
  const published = useCount("published");
  const draft = useCount("draft");

  const recent = useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: () => articlesApi.listAll({ limit: 5 }),
    staleTime: 30_000,
  });

  const name = user?.email?.split("@")[0] ?? "Editor";
  const stats = [
    { label: "Articles", value: total.data?.meta.total },
    { label: "Published", value: published.data?.meta.total },
    { label: "Draft", value: draft.data?.meta.total },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Redesign §16: editorial control center, bukan kartu statistik doang. */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {name}.
        </h1>
        <p className="mt-1 text-muted-foreground">
          Berikut kondisi KabarKode hari ini.
        </p>
      </section>

      {/* Ringkasan tipis: angka besar di whitespace, bukan 8 kartu. */}
      <section className="flex flex-wrap gap-x-12 gap-y-4 border-y border-border py-6">
        {stats.map((s) => (
          <div key={s.label}>
            {s.value === undefined ? (
              <Skeleton className="h-9 w-14" />
            ) : (
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {s.value}
              </span>
            )}
            <p className="mt-0.5 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        {/* Recent Articles */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Recent Articles</h2>
            {can(user?.role, "manage_articles") && (
              <Button variant="ghost" size="sm" asChild className="kk-transition gap-1 text-xs text-muted-foreground">
                <Link href="/articles">
                  Lihat semua <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
          {recent.isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : recent.isError ? (
            <div className="rounded-xl border py-10 text-center text-sm">
              <p className="text-destructive">Gagal memuat artikel terbaru.</p>
              <Button variant="outline" className="mt-3" onClick={() => recent.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : recent.data && recent.data.items.length > 0 ? (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
              {recent.data.items.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/articles/${a.id}/edit`}
                    className="kk-transition group flex items-center gap-3 px-4 py-3 hover:bg-accent/60"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {a.title}
                    </span>
                    <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
                      {formatRelative(a.updated_at)}
                    </span>
                    <Badge
                      variant={STATUS_CONFIG[a.status].variant}
                      className={STATUS_CONFIG[a.status].className}
                    >
                      {STATUS_CONFIG[a.status].label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Belum ada cerita."
              description="Cerita pertamamu dimulai di sini."
              actionLabel="Tulis Artikel"
              actionHref="/articles/new"
            />
          )}
        </section>

        {/* Redesign §17: Quick Actions — hanya operasi yang sering dipakai. */}
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Quick Actions</h2>
          <div className="space-y-2">
            {can(user?.role, "manage_articles") && (
              <Button asChild className="w-full justify-start gap-2 rounded-xl">
                <Link href="/articles/new">
                  <Plus /> New Article
                </Link>
              </Button>
            )}
            {can(user?.role, "manage_media") && (
              <Button asChild variant="outline" className="w-full justify-start gap-2 rounded-xl bg-card">
                <Link href="/media">
                  <Upload /> Upload Media
                </Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
