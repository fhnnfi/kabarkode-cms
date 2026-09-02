"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArrowLeft, Check, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { articleFormSchema, type ArticleFormValues } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils/slug";
import { useCreateArticle, useUpdateArticle, usePublishArticle, useArchiveArticle } from "@/features/articles/hooks";
import { useMedia } from "@/features/media/hooks";
import { useCategories, useTags, useAuthors } from "@/features/taxonomy/hooks";
import { STATUS_CONFIG, ARTICLE_TYPE_OPTIONS } from "@/features/articles/status-config";
import { useAuth } from "@/features/auth/auth-provider";
import { can } from "@/lib/auth/permissions";
import type { Article, ArticleStatus, ArticleType } from "@/types/models";

const EXCERPT_SOFT_LIMIT = 300;

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

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = Boolean(article);

  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const archiveArticle = useArchiveArticle();

  const categories = useCategories();
  const tags = useTags();
  const authors = useAuthors();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: toFormValues(article),
  });

  const [dirty, setDirty] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [coverOpen, setCoverOpen] = useState(false);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const savedRef = useRef(false);

  const values = useWatch({ control: form.control });
  const title = values.title ?? "";
  const coverId = values.cover_media_id ?? null;
  const coverMedia = useMedia(coverId);
  const tagIds: string[] = values.tag_ids ?? [];

  // Slug otomatis dari judul selama user belum menyentuh field slug (§24).
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(title), { shouldValidate: false });
    }
  }, [title, slugTouched, form]);

  // Warning unsaved changes saat close tab (§63).
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

  const onDirty = useCallback(() => setDirty(true), []);

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
      return undefined;
    }
    try {
      let result: Article;
      if (isEdit && article) {
        result = await updateArticle.mutateAsync({ id: article.id, body: buildPayload(status) });
      } else {
        result = await createArticle.mutateAsync(buildPayload(status ?? "draft"));
      }
      savedRef.current = true;
      setDirty(false);
      return result;
    } catch {
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

  const busy = createArticle.isPending || updateArticle.isPending || publishArticle.isPending;
  const excerptLen = (values.excerpt ?? "").length;

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
    <div className="space-y-4">
      {/* Header bar (§64) */}
      <div className="flex flex-wrap items-center gap-2">
        {guardedLink("/articles", "Artikel")}
        <span className="text-sm text-muted-foreground">
          {isEdit ? "Edit artikel" : "Artikel baru"}
        </span>
        {dirty && <Badge variant="secondary">Perubahan belum disimpan</Badge>}
        <div className="ml-auto flex items-center gap-2">
          {isEdit && can(user?.role, "archive_articles") && article?.status === "published" && (
            <Button variant="outline" onClick={onArchive} disabled={busy || archiveArticle.isPending}>
              <Archive /> Arsipkan
            </Button>
          )}
          <Button variant="outline" onClick={onSaveDraft} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : null}
            Simpan Draft
          </Button>
          {can(user?.role, "publish_articles") && (
            <Button onClick={() => setPublishConfirm(true)} disabled={busy}>
              <Send /> Publikasikan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Kolom utama */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              className="h-11 text-lg font-semibold"
              placeholder="Judul artikel"
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title", { onChange: onDirty })}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="di-generate-otomatis-dari-judul"
              aria-invalid={Boolean(form.formState.errors.slug)}
              {...form.register("slug", {
                onChange: () => {
                  setSlugTouched(true);
                  onDirty();
                },
              })}
            />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="excerpt">Excerpt</Label>
              <span className={excerptLen > EXCERPT_SOFT_LIMIT ? "text-xs text-amber-600" : "text-xs text-muted-foreground"}>
                {excerptLen} karakter
                {excerptLen > EXCERPT_SOFT_LIMIT && " — sebaiknya ≤ 300 untuk kartu & preview sosial"}
              </span>
            </div>
            <Textarea
              id="excerpt"
              rows={3}
              placeholder="Ringkasan singkat untuk kartu artikel dan hasil pencarian"
              aria-invalid={Boolean(form.formState.errors.excerpt)}
              {...form.register("excerpt", { onChange: onDirty })}
            />
            {form.formState.errors.excerpt && (
              <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Konten</Label>
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
              <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>
        </div>

        {/* Sidebar publishing */}
        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) => {
                    form.setValue("status", v as ArticleStatus);
                    onDirty();
                  }}
                >
                  <SelectTrigger aria-label="Status artikel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as ArticleStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe Artikel</Label>
                <Select
                  value={values.article_type}
                  onValueChange={(v) => {
                    form.setValue("article_type", v as ArticleType);
                    onDirty();
                  }}
                >
                  <SelectTrigger aria-label="Tipe artikel"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={values.category_id ?? "none"}
                  onValueChange={(v) => {
                    form.setValue("category_id", v === "none" ? null : v);
                    onDirty();
                  }}
                >
                  <SelectTrigger aria-label="Kategori"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Tanpa kategori —</SelectItem>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Author</Label>
                <Select
                  value={values.author_id ?? "none"}
                  onValueChange={(v) => {
                    form.setValue("author_id", v === "none" ? null : v);
                    onDirty();
                  }}
                >
                  <SelectTrigger aria-label="Author"><SelectValue placeholder="Pilih author" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Belum ditentukan —</SelectItem>
                    {(authors.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {tagIds.length > 0 ? `${tagIds.length} tag dipilih` : "Cari tag…"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Ketik nama tag…" />
                      <CommandList>
                        <CommandEmpty>Tidak ada tag.</CommandEmpty>
                        <CommandGroup>
                          {(tags.data ?? []).map((t) => {
                            const selected = tagIds.includes(t.id);
                            return (
                              <CommandItem
                                key={t.id}
                                value={t.name}
                                onSelect={() => {
                                  form.setValue(
                                    "tag_ids",
                                    selected
                                      ? tagIds.filter((id) => id !== t.id)
                                      : [...tagIds, t.id],
                                  );
                                  onDirty();
                                }}
                              >
                                {t.name}
                                {selected && <Check className="ml-auto" />}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {tagIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(tags.data ?? [])
                      .filter((t) => tagIds.includes(t.id))
                      .map((t) => (
                        <Badge key={t.id} variant="secondary">
                          {t.name}
                          <button
                            type="button"
                            aria-label={`Hapus tag ${t.name}`}
                            onClick={() => {
                              form.setValue("tag_ids", tagIds.filter((id) => id !== t.id));
                              onDirty();
                            }}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {coverId && (
                <div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                  {coverMedia.data ? (
                    <Image
                      src={coverMedia.data.public_url}
                      alt="Cover artikel"
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Memuat preview…
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCoverOpen(true)}>
                  Pilih Gambar
                </Button>
                {coverId && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { form.setValue("cover_media_id", null); onDirty(); }}>
                    Hapus
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Sumber</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="source_name">Source Name</Label>
                <Input id="source_name" placeholder="mis. The Verge" {...form.register("source_name", { onChange: onDirty })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_url">Source URL</Label>
                <Input id="source_url" type="url" placeholder="https://…" aria-invalid={Boolean(form.formState.errors.source_url)} {...form.register("source_url", { onChange: onDirty })} />
                {form.formState.errors.source_url && (
                  <p className="text-sm text-destructive">{form.formState.errors.source_url.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

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

      {/* Konfirmasi publish (§35) */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publikasikan Artikel?</DialogTitle>
            <DialogDescription>Artikel akan tersedia untuk publik di website KabarKode.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishConfirm(false)}>Batal</Button>
            <Button onClick={onPublishConfirmed} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />} Publikasikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi tinggalkan halaman dengan perubahan belum disimpan (§63) */}
      <Dialog open={Boolean(leaveTarget)} onOpenChange={(o) => !o && setLeaveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ada perubahan belum disimpan</DialogTitle>
            <DialogDescription>Tinggalkan halaman tanpa menyimpan?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveTarget(null)}>Tetap di sini</Button>
            <Button variant="destructive" onClick={() => router.push(leaveTarget!)}>
              Tinggalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
