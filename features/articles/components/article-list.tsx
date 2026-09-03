"use client";

import Link from "next/link";
import Image from "next/image";
import { Archive, Eye, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMedia } from "@/features/media/hooks";
import { useArchiveArticle, useDeleteArticle, usePublishArticle } from "@/features/articles/hooks";
import { STATUS_CONFIG } from "@/features/articles/status-config";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { formatRelative } from "@/lib/utils/format";
import { ARTICLE_TYPE_LABELS } from "@/features/articles/status-config";
import type { Article } from "@/types/models";
import { useState } from "react";

type PendingAction =
  | { kind: "publish" | "archive" | "delete"; article: Article }
  | null;

/**
 * Aksi kontekstual satu artikel (redesign §10, §67–§68):
 * destructive action dengan copy konsekuensi jelas.
 */
export function ArticleActions({ article }: { article: Article }) {
  const { user } = useAuth();
  const publish = usePublishArticle();
  const archive = useArchiveArticle();
  const del = useDeleteArticle();
  const [pending, setPending] = useState<PendingAction>(null);
  const busy = publish.isPending || archive.isPending || del.isPending;

  const labels: Record<string, { title: string; desc: string; cta: string }> = {
    publish: {
      title: "Publikasikan artikel?",
      desc: `“${pending?.article.title ?? ""}” akan tersedia untuk publik.`,
      cta: "Publikasikan artikel",
    },
    archive: {
      title: "Arsipkan artikel?",
      desc: "Artikel tidak lagi tampil untuk publik tetapi bisa dipulihkan dengan mengedit statusnya.",
      cta: "Arsipkan artikel",
    },
    delete: {
      title: "Hapus artikel?",
      desc: "Artikel akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.",
      cta: "Hapus artikel",
    },
  };

  function runAction() {
    if (!pending) return;
    const { kind, article: a } = pending;
    const done = () => setPending(null);
    if (kind === "publish") publish.mutate(a.id, { onSuccess: done });
    else if (kind === "archive") archive.mutate(a.id, { onSuccess: done });
    else del.mutate(a.id, { onSuccess: done });
  }

  const cfg = pending ? labels[pending.kind] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="kk-transition size-8 opacity-60 group-hover:opacity-100"
            aria-label={`Aksi untuk ${article.title}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/articles/${article.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/articles/${article.id}/preview`} target="_blank">
              <Eye /> Preview
            </Link>
          </DropdownMenuItem>
          {can(user?.role, "publish_articles") && article.status !== "published" && (
            <DropdownMenuItem onSelect={() => setPending({ kind: "publish", article })}>
              <Send /> Publikasikan
            </DropdownMenuItem>
          )}
          {can(user?.role, "archive_articles") && article.status !== "archived" && (
            <DropdownMenuItem onSelect={() => setPending({ kind: "archive", article })}>
              <Archive /> Arsipkan
            </DropdownMenuItem>
          )}
          {can(user?.role, "delete_articles") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setPending({ kind: "delete", article })}
              >
                <Trash2 /> Hapus
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cfg?.title}</DialogTitle>
            <DialogDescription>{cfg?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={busy}>
              Batal
            </Button>
            <Button
              variant={pending?.kind === "delete" ? "destructive" : "default"}
              onClick={runAction}
              disabled={busy}
            >
              {cfg?.cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Thumbnail cover; fallback monogram tipe artikel saat cover belum ada/di-fetch. */
function ArticleThumb({ article }: { article: Article }) {
  const { data: media } = useMedia(article.cover_media_id);
  if (media) {
    return (
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
        <Image src={media.public_url} alt="" fill sizes="56px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border bg-muted font-mono text-xs font-bold text-muted-foreground">
      {ARTICLE_TYPE_LABELS[article.article_type]?.slice(0, 2).toUpperCase() ?? "AR"}
    </div>
  );
}

/**
 * Daftar editorial (redesign §20): baris dengan thumbnail, judul,
 * kategori · author, status, waktu relatif — bukan tabel data padat.
 */
export function ArticleList({ articles }: { articles: Article[] }) {
  const { user } = useAuth();
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
      {articles.map((a) => (
        <li
          key={a.id}
          className="kk-transition group flex items-center gap-3 px-3 py-3 hover:bg-accent/50 md:px-4"
        >
          <ArticleThumb article={a} />
          <div className="min-w-0 flex-1">
            <Link
              href={`/articles/${a.id}/edit`}
              className="kk-transition block truncate text-sm font-semibold tracking-tight hover:underline"
            >
              {a.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[a.category?.name, a.author?.name].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <span className="hidden w-28 shrink-0 text-right font-mono text-xs text-muted-foreground sm:block">
            {formatRelative(a.updated_at)}
          </span>
          <Badge
            variant={STATUS_CONFIG[a.status].variant}
            className={STATUS_CONFIG[a.status].className + " hidden shrink-0 md:inline-flex"}
          >
            {STATUS_CONFIG[a.status].label}
          </Badge>
          {can(user?.role, "publish_articles") && a.status === "draft" && (
            <QuickPublish article={a} />
          )}
          <ArticleActions article={a} />
        </li>
      ))}
    </ul>
  );
}

/** Aksi publish kontekstual langsung dari baris (§10, §37). */
function QuickPublish({ article }: { article: Article }) {
  const publish = usePublishArticle();
  return (
    <Button
      variant="outline"
      size="sm"
      className="kk-transition hidden shrink-0 lg:inline-flex"
      disabled={publish.isPending}
      onClick={() => publish.mutate(article.id)}
      aria-label={`Publikasikan ${article.title}`}
    >
      <Send className="size-3.5" /> Publish
    </Button>
  );
}
