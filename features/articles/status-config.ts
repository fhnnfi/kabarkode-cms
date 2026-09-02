import type { ArticleStatus, ArticleType } from "@/types/models";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

/** Konfigurasi status terpusat (requirement §18) — bukan hardcode di komponen. */
export const STATUS_CONFIG: Record<
  ArticleStatus,
  { label: string; variant: BadgeVariant; className?: string }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: {
    label: "Published",
    variant: "default",
    className: "bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-600",
  },
  archived: { label: "Archived", variant: "outline", className: "text-muted-foreground" },
};

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  news: "News",
  analysis: "Analysis",
  tutorial: "Tutorial",
  security: "Security",
  release: "Release",
};

export const ARTICLE_TYPE_OPTIONS = (
  Object.entries(ARTICLE_TYPE_LABELS) as [ArticleType, string][]
).map(([value, label]) => ({ value, label }));

export const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as ArticleStatus[]).map((value) => ({
  value,
  label: STATUS_CONFIG[value].label,
}));
