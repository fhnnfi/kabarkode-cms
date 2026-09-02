import { z } from "zod";
import { SLUG_REGEX } from "@/lib/utils/slug";

/**
 * Validasi frontend untuk UX (requirement §38, §6 Rule 6).
 * Batasan mengikuti backend schemas/article.schema.ts — backend tetap otoritas.
 */
export const articleStatusEnum = z.enum(["draft", "published", "archived"]);
export const articleTypeEnum = z.enum(["news", "analysis", "tutorial", "security", "release"]);

export const articleFormSchema = z
  .object({
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(300, "Maksimal 300 karakter"),
    slug: z
      .string()
      .trim()
      .max(200)
      .regex(SLUG_REGEX, "Slug harus lowercase URL-safe (a-z0-9-)")
      .optional()
      .or(z.literal("")),
    excerpt: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
    content: z.string().min(1, "Konten wajib diisi"),
    status: articleStatusEnum.default("draft"),
    article_type: articleTypeEnum.default("news"),
    author_id: z.string().uuid().nullable().optional(),
    category_id: z.string().uuid().nullable().optional(),
    cover_media_id: z.string().uuid().nullable().optional(),
    source_name: z.string().trim().max(200).optional().or(z.literal("")),
    source_url: z
      .string()
      .url("URL tidak valid")
      .max(2048)
      .optional()
      .or(z.literal("")),
    tag_ids: z.array(z.string().uuid()).max(50).default([]),
  })
  .refine((v) => !(v.source_name && !v.source_url) || (!v.source_url || !!v.source_name), {
    message: "Source URL dan Source Name sebaiknya diisi berpasangan",
    path: ["source_url"],
  });

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter").max(120),
  slug: z.string().trim().regex(SLUG_REGEX).max(140).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, "Wajib diisi").max(80),
  slug: z.string().trim().regex(SLUG_REGEX).max(100).optional().or(z.literal("")),
});
export type TagFormValues = z.infer<typeof tagFormSchema>;

export const authorFormSchema = z.object({
  name: z.string().trim().min(2, "Minimal 2 karakter").max(120),
  slug: z.string().trim().regex(SLUG_REGEX).max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(5000).optional().or(z.literal("")),
  avatar_media_id: z.string().uuid().nullable().optional(),
});
export type AuthorFormValues = z.infer<typeof authorFormSchema>;
