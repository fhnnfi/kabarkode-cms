"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useArchiveArticle,
  useDeleteArticle,
  usePublishArticle,
} from "@/features/articles/hooks";
import { STATUS_CONFIG } from "@/features/articles/status-config";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/format";
import type { Article } from "@/types/models";

type PendingAction =
  | { kind: "publish" | "archive" | "delete"; article: Article }
  | null;

export function ArticleActions({ article }: { article: Article }) {
  const { user } = useAuth();
  const router = useRouter();
  const publish = usePublishArticle();
  const archive = useArchiveArticle();
  const del = useDeleteArticle();
  const [pending, setPending] = useState<PendingAction>(null);
  const busy = publish.isPending || archive.isPending || del.isPending;

  const labels: Record<string, { title: string; desc: string; cta: string }> = {
    publish: {
      title: "Publikasikan artikel?",
      desc: `“${pending?.article.title ?? ""}” akan tersedia untuk publik.`,
      cta: "Publikasikan",
    },
    archive: {
      title: "Arsipkan artikel?",
      desc: "Artikel tidak lagi tampil di publik tetapi bisa dipulihkan dengan mengedit statusnya.",
      cta: "Arsipkan",
    },
    delete: {
      title: "Hapus artikel?",
      desc: "Tindakan ini tidak dapat dibatalkan.",
      cta: "Hapus",
    },
  };

  function runAction() {
    if (!pending) return;
    const { kind, article: a } = pending;
    const done = () => setPending(null);
    if (kind === "publish") publish.mutate(a.id, { onSuccess: done });
    else if (kind === "archive") archive.mutate(a.id, { onSuccess: done });
    else
      del.mutate(a.id, {
        onSuccess: () => {
          done();
          router.push("/articles");
        },
      });
  }

  const cfg = pending ? labels[pending.kind] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${article.title}`}>
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

export function articleColumns(): ColumnDef<Article>[] {
  return [
    {
      accessorKey: "title",
      header: "Judul",
      cell: ({ row }) => (
        <Link
          href={`/articles/${row.original.id}/edit`}
          className="line-clamp-2 max-w-[420px] font-medium hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = STATUS_CONFIG[row.original.status];
        return (
          <Badge variant={s.variant} className={s.className}>
            {s.label}
          </Badge>
        );
      },
      size: 110,
    },
    {
      accessorKey: "article_type",
      header: "Tipe",
      cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span>,
      size: 100,
    },
    {
      id: "category",
      accessorFn: (a) => a.category?.name,
      header: "Kategori",
      size: 140,
    },
    {
      id: "author",
      accessorFn: (a) => a.author?.name,
      header: "Author",
      size: 140,
    },
    {
      accessorKey: "published_at",
      header: "Dipublikasi",
      cell: ({ getValue }) => formatDate(getValue() as string | null),
      size: 160,
    },
    {
      accessorKey: "updated_at",
      header: "Diperbarui",
      cell: ({ getValue }) => formatDate(getValue() as string),
      size: 160,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <ArticleActions article={row.original} />,
      size: 50,
    },
  ];
}

export function ArticleTable({ articles }: { articles: Article[] }) {
  const columns = articleColumns();
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<Article>({
    data: articles,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
        Tidak ada artikel yang cocok. Coba ubah pencarian atau filter.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
