"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_CONFIG } from "@/features/articles/status-config";
import { useMedia } from "@/features/media/hooks";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import { formatDate } from "@/lib/utils/format";
import type { Article } from "@/types/models";

/**
 * Renderer preview artikel (requirement §37, §56):
 * HTML konten disanitasi DOMPurify sebelum dangerouslySetInnerHTML.
 */
export function ArticleDetail({ article }: { article: Article }) {
  const s = STATUS_CONFIG[article.status];
  const cover = useMedia(article.cover_media_id);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={s.variant} className={s.className}>{s.label}</Badge>
          <Badge variant="outline" className="capitalize">{article.article_type}</Badge>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/articles/${article.id}/edit`}>Edit artikel</Link>
        </Button>
      </div>

      {cover.data && (
        <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-xl border bg-muted">
          <Image
            src={cover.data.public_url}
            alt={cover.data.file_name}
            fill
            sizes="768px"
            className="object-cover"
          />
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
      {article.excerpt && (
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-4 text-sm text-muted-foreground">
        <span>
          Oleh <span className="font-medium text-foreground">{article.author?.name ?? "—"}</span>
        </span>
        {article.category && <span>{article.category.name}</span>}
        <span>{formatDate(article.published_at ?? article.created_at)}</span>
        {article.tags.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {article.tags.map((t) => (
              <Badge key={t.id} variant="outline">{t.name}</Badge>
            ))}
          </span>
        )}
      </div>

      <div
        className="article-content prose prose-slate dark:prose-invert mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
      />

      {(article.source_name || article.source_url) && (
        <aside className="mt-8 rounded-lg border bg-muted/40 p-4 text-sm">
          <span className="font-medium">Sumber: </span>
          {article.source_url ? (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary underline"
            >
              {article.source_name ?? article.source_url}
            </a>
          ) : (
            <span>{article.source_name}</span>
          )}
        </aside>
      )}
    </article>
  );
}
