"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArrowLeft, Check, Eye, Loader2, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { MediaPicker } from "@/components/media/media-picker";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CategoryPicker } from "@/features/articles/components/category-picker";
import { AuthorPicker } from "@/features/articles/components/author-picker";
import { TagChips } from "@/features/articles/components/tag-chips";
import { CoverDropzone } from "@/features/articles/components/cover-dropzone";
import { articleFormSchema, type ArticleFormValues } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/slug";
import { useCreateArticle, useUpdateArticle, usePublishArticle, useArchiveArticle } from "@/features/articles/hooks";
import { STATUS_CONFIG, ARTICLE_TYPE_OPTIONS } from "@/features/articles/status-config";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { Article, ArticleStatus, ArticleType } from "@/types/models";

const EXCERPT_SOFT_LIMIT = 300;
const SITE_ORIGIN = "kabarkode.dev";

interface ArticleFormProps {
  article?: Article; // undefined = mode create
}

function toFormValues(article?: Article): ArticleFormValues {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    status: article?.status ?? "draft",
    article_type: article?.article_type ?? "news",
    author_id: article?.author_id ?? null,
    category_id: article?.category_id ?? null,
    cover_media_id: article?.cover_media_id ?? null,
    source_name: article?.source_name ?? "",
    source_url: article?.source_url ?? "",
    tag_ids: article?.tags.map((t) => t.id) ?? [],
  };
}

type SaveState = "saved" | "unsaved" | "saving";

/**
 * Article editor — editorial workspace (redesign §21–§26, §37, §42, §69–§70):
 * judul besar seperti sedang menulis, metadata compact di sidebar sticky,
 * status dikendalikan aksi eksplisit (Publish/Archive), bukan dropdown.
 */
export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = Boolean(article);

  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const archiveArticle = useArchiveArticle();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: toFormValues(article),
  });

  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [slugEditing, setSlugEditing] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>(isEdit ? "saved" : "unsaved");
  const savedRef = useRef(false);

  const values = useWatch({ control: form.control });
  const title = values.title ?? "";
  const coverId = values.cover_media_id ?? null;
  const slug = values.slug ?? "";

  // Slug otomatis dari judul selama user belum menyentuh field slug (§24).
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(title), { shouldValidate: false });
    }
  }, [title, slugTouched, form]);

  // Warning unsaved changes saat close tab (§43).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty && !savedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onDirty = useCallback(() => {
    setDirty(true);
    setSaveState("unsaved");
  }, []);

  function buildPayload(status?: ArticleStatus): Record<string, unknown> {
    const v = form.getValues();
    const payload: Record<string, unknown> = {
      title: v.title.trim(),
      content: v.content,
      article_type: v.article_type,
      author_id: v.author_id || null,
      category_id: v.category_id || null,
      cover_media_id: v.cover_media_id || null,
      excerpt: v.excerpt?.trim() || null,
      source_name: v.source_name?.trim() || null,
      source_url: v.source_url?.trim() || null,
      tag_ids: v.tag_ids,
    };
    if (v.slug?.trim()) payload.slug = v.slug.trim();
    if (status) payload.status = status;
    else if (isEdit) payload.status = v.status;
    return payload;
  }

  async function save(status?: ArticleStatus): Promise<Article | undefined> {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Periksa kembali field yang ditandai.");
      setSaveState("unsaved");
      return undefined;
    }
    setSaveState("saving");
    try {
      let result: Article;
      if (isEdit && article) {
        result = await updateArticle.mutateAsync({ id: article.id, body: buildPayload(status) });
      } else {
        result = await createArticle.mutateAsync(buildPayload(status ?? "draft"));
      }
      savedRef.current = true;
      setDirty(false);
      setSaveState("saved");
      return result;
    } catch {
      setSaveState("unsaved");
      // toast sudah ditangani hook
      return undefined;
    } finally {
      savedRef.current = false;
    }
  }

  async function onSaveDraft() {
    const result = await save("draft");
    if (result && !isEdit) router.replace(`/articles/${result.id}/edit`);
  }

  const [publishConfirm, setPublishConfirm] = useState(false);

  async function onPublishConfirmed() {
    let result = await save();
    if (!result) return;
    if (result.status !== "published") {
      result = await publishArticle.mutateAsync(result.id).catch(() => undefined);
      if (!result) return;
    }
    setPublishConfirm(false);
    router.push("/articles");
  }

  async function onArchive() {
    if (!article) return;
    archiveArticle.mutate(article.id, { onSuccess: () => router.push("/articles") });
  }

  // Keyboard shortcuts global editor (§42): Ctrl/Cmd+S simpan, Ctrl/Cmd+Enter publish.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        void onSaveDraft();
      } else if (k === "enter") {
        e.preventDefault();
        if (can(user?.role, "publish_articles")) setPublishConfirm(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const busy = createArticle.isPending || updateArticle.isPending || publishArticle.isPending;
  const excerptLen = (values.excerpt ?? "").length;
  const currentStatus = (values.status ?? "draft") as ArticleStatus;

  function guardedLink(href: string, label: string) {
    return (
      <Button
        variant="ghost"
        size="sm"
        asChild={!dirty}
        onClick={dirty ? () => setLeaveTarget(href) : undefined}
      >
        {dirty ? (
          <span className="flex items-center gap-1">
            <ArrowLeft /> {label}
          </span>
        ) : (
          <Link href={href} className="flex items-center gap-1">
            <ArrowLeft /> {label}
          </Link>
        )}
      </Button>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col">
      {/* Publishing header (§26): save state + Publish selalu terlihat. */}
      <div className="sticky top-14 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/85 px-4 py-2.5 backdrop-blur md:-mx-6 md:px-6">
        {guardedLink("/articles", "Articles")}
        <SaveStateIndicator state={saveState} status={currentStatus} />
        <div className="ml-auto flex items-center gap-2">
          {isEdit && (
            <Button variant="ghost" size="sm" asChild className="kk-transition gap-1.5">
              <Link href={`/articles/${article!.id}/preview`} target="_blank">
                <Eye /> Preview
              </Link>
            </Button>
          )}
          {isEdit && can(user?.role, "archive_articles") && article?.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              disabled={busy || archiveArticle.isPending}
            >
              <Archive /> Arsipkan
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onSaveDraft} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Save Draft
          </Button>
          {can(user?.role, "publish_articles") && currentStatus !== "published" && (
            <Button size="sm" onClick={() => setPublishConfirm(true)} disabled={busy}>
              <Send /> Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Kolom menulis: whitespace & hierarki, bukan kartu (§21, §75). */}
        <div className="mx-auto w-full max-w-2xl min-w-0">
          <p className="mb-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            Write your story
          </p>

          {/* Judul editorial 48px (§22) */}
          <textarea
            rows={1}
            aria-label="Judul artikel"
            placeholder="Judul artikel…"
            value={title}
            onChange={(e) => {
              form.setValue("title", e.target.value.replace(/\n/g, ""), { shouldValidate: true });
              onDirty();
            }}
            className={cn(
              "w-full resize-none overflow-hidden bg-transparent text-[32px] leading-[1.1] font-bold tracking-tight outline-none placeholder:text-muted-foreground/60 md:text-[48px]",
              form.formState.errors.title && "text-destructive",
            )}
            style={{ minHeight: "1.2em" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}

          {/* Excerpt sekunder di bawah judul (§23) */}
          <textarea
            rows={2}
            aria-label="Excerpt artikel"
            placeholder="Write a concise description of this article…"
            value={values.excerpt ?? ""}
            {...form.register("excerpt", { onChange: onDirty })}
            className="mt-3 w-full resize-none bg-transparent text-base leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <div className="flex items-center justify-between">
            {form.formState.errors.excerpt ? (
              <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
            ) : (
              <span />
            )}
            <span
              className={cn(
                "font-mono text-[10px]",
                excerptLen > EXCERPT_SOFT_LIMIT ? "text-amber-600" : "text-muted-foreground/60",
              )}
            >
              {excerptLen}
              {excerptLen > EXCERPT_SOFT_LIMIT && " — sebaiknya ≤ 300"}
            </span>
          </div>

          {/* Slug inline, klik Edit (§24) */}
          <div className="mt-4 flex items-center gap-2 border-t border-dashed pt-4">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Slug
            </span>
            {slugEditing ? (
              <Input
                autoFocus
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  form.setValue("slug", e.target.value, { shouldValidate: true });
                  onDirty();
                }}
                onBlur={() => setSlugEditing(false)}
                onKeyDown={(e) => e.key === "Enter" && setSlugEditing(false)}
                className="h-7 max-w-xs font-mono text-xs"
                aria-label="Edit slug"
              />
            ) : (
              <>
                <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                  {SITE_ORIGIN}/{slug || "…"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="kk-transition h-6 gap-1 px-1.5 text-xs text-muted-foreground"
                  onClick={() => setSlugEditing(true)}
                >
                  <Pencil className="size-3" /> Edit
                </Button>
              </>
            )}
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <Separator className="my-5" />

          <RichTextEditor
            value={article?.content ?? ""}
            editable={!busy}
            onChange={(html) => {
              form.setValue("content", html, { shouldValidate: true });
              onDirty();
            }}
            onBlur={onDirty}
          />
          {form.formState.errors.content && (
            <p className="mt-2 text-sm text-destructive">{form.formState.errors.content.message}</p>
          )}
        </div>

        {/* Metadata sidebar compact + sticky (§69, §70) */}
        <aside className="hidden w-full shrink-0 lg:block">
          <div className="sticky top-28 space-y-6">
            <MetaSection title="Publishing">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant={STATUS_CONFIG[currentStatus].variant}
                  className={STATUS_CONFIG[currentStatus].className}
                >
                  {STATUS_CONFIG[currentStatus].label}
                </Badge>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Status berubah lewat aksi: <span className="font-mono">Publish</span> atau{" "}
                <span className="font-mono">Arsipkan</span> di atas.
              </p>
            </MetaSection>

            <MetaSection title="Organization">
              <SegmentedControl<ArticleType>
                ariaLabel="Tipe artikel"
                options={ARTICLE_TYPE_OPTIONS}
                value={values.article_type ?? "news"}
                onChange={(v) => {
                  form.setValue("article_type", v);
                  onDirty();
                }}
              />
              <CategoryPicker
                value={values.category_id ?? null}
                onChange={(id) => {
                  form.setValue("category_id", id);
                  onDirty();
                }}
              />
              <TagChips
                value={values.tag_ids ?? []}
                onChange={(ids) => {
                  form.setValue("tag_ids", ids);
                  onDirty();
                }}
              />
              <AuthorPicker
                value={values.author_id ?? null}
                onChange={(id) => {
                  form.setValue("author_id", id);
                  onDirty();
                }}
              />
            </MetaSection>

            <MetaSection title="Cover">
              <CoverDropzone
                mediaId={coverId}
                onChange={(id) => {
                  form.setValue("cover_media_id", id);
                  onDirty();
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="kk-transition text-xs text-muted-foreground"
                onClick={() => setCoverOpen(true)}
              >
                Choose from Media Library
              </Button>
            </MetaSection>

            <MetaSection title="Source">
              <Input
                placeholder="mis. The Verge"
                aria-label="Source name"
                className="h-8 text-sm"
                {...form.register("source_name", { onChange: onDirty })}
              />
              <Input
                type="url"
                placeholder="https://example.com/article"
                aria-label="Source URL"
                className="h-8 font-mono text-xs"
                aria-invalid={Boolean(form.formState.errors.source_url)}
                {...form.register("source_url", { onChange: onDirty })}
              />
              {form.formState.errors.source_url && (
                <p className="text-xs text-destructive">{form.formState.errors.source_url.message}</p>
              )}
            </MetaSection>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Kbd>⌘S</Kbd> simpan
              </span>
              <span className="flex items-center gap-1">
                <Kbd>⌘↵</Kbd> publish
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Metadata untuk layar kecil: di bawah konten, tetap satu kolom (§44). */}
      <div className="grid gap-6 pb-8 lg:hidden">
        <MetaSection title="Organization">
          <SegmentedControl<ArticleType>
            ariaLabel="Tipe artikel"
            options={ARTICLE_TYPE_OPTIONS}
            value={values.article_type ?? "news"}
            onChange={(v) => {
              form.setValue("article_type", v);
              onDirty();
            }}
          />
          <CategoryPicker
            value={values.category_id ?? null}
            onChange={(id) => {
              form.setValue("category_id", id);
              onDirty();
            }}
          />
          <TagChips
            value={values.tag_ids ?? []}
            onChange={(ids) => {
              form.setValue("tag_ids", ids);
              onDirty();
            }}
          />
          <AuthorPicker
            value={values.author_id ?? null}
            onChange={(id) => {
              form.setValue("author_id", id);
              onDirty();
            }}
          />
        </MetaSection>
        <MetaSection title="Cover">
          <CoverDropzone
            mediaId={coverId}
            onChange={(id) => {
              form.setValue("cover_media_id", id);
              onDirty();
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="kk-transition text-xs text-muted-foreground"
            onClick={() => setCoverOpen(true)}
          >
            Choose from Media Library
          </Button>
        </MetaSection>
        <MetaSection title="Source">
          <Input
            placeholder="mis. The Verge"
            aria-label="Source name"
            className="h-8 text-sm"
            {...form.register("source_name", { onChange: onDirty })}
          />
          <Input
            type="url"
            placeholder="https://example.com/article"
            aria-label="Source URL"
            className="h-8 font-mono text-xs"
            aria-invalid={Boolean(form.formState.errors.source_url)}
            {...form.register("source_url", { onChange: onDirty })}
          />
        </MetaSection>
      </div>

      <MediaPicker
        open={coverOpen}
        onOpenChange={setCoverOpen}
        folder="articles"
        onSelect={(m) => {
          form.setValue("cover_media_id", m.id);
          onDirty();
          setCoverOpen(false);
        }}
      />

      {/* Konfirmasi publish (§37) */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publikasikan Artikel?</DialogTitle>
            <DialogDescription>
              Artikel akan tersedia untuk publik di website KabarKode.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishConfirm(false)}>
              Batal
            </Button>
            <Button onClick={onPublishConfirmed} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />} Publikasikan artikel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi tinggalkan halaman dengan perubahan belum disimpan (§43) */}
      <Dialog open={Boolean(leaveTarget)} onOpenChange={(o) => !o && setLeaveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ada perubahan belum disimpan</DialogTitle>
            <DialogDescription>Artikelmu punya perubahan yang belum disimpan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveTarget(null)}>
              Tetap di sini
            </Button>
            <Button variant="destructive" onClick={() => router.push(leaveTarget!)}>
              Buang perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Indikator save state halus (§25). */
function SaveStateIndicator({ state, status }: { state: SaveState; status: ArticleStatus }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      {state === "saving" ? (
        <>
          <Loader2 className="size-3 animate-spin" /> Saving…
        </>
      ) : state === "saved" ? (
        <>
          <span className="size-1.5 rounded-full bg-brand ring-1 ring-black/10" />
          Saved · {STATUS_CONFIG[status].label}
        </>
      ) : (
        <>
          <span className="size-1.5 rounded-full bg-amber-500" />
          Unsaved changes
        </>
      )}
    </span>
  );
}

/** Seksi metadata compact dengan judul kecil monospace (§69). */
function MetaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
        <Check className="size-3 text-brand-foreground opacity-0" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}
