/** Tipe domain — mencerminkan kontrak backend (requirement §84). */

export type ArticleStatus = "draft" | "published" | "archived";
export type ArticleType = "news" | "analysis" | "tutorial" | "security" | "release";
export type UserRole = "admin" | "editor" | "author";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export interface RefSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  article_type: ArticleType;
  author_id: string | null;
  category_id: string | null;
  cover_media_id: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: RefSummary | null;
  category: RefSummary | null;
  tags: RefSummary[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Author {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string | null;
  avatar_media_id: string | null;
  /** Email akun login tertaut (role author) — null bila belum ada akun. */
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  file_name: string;
  object_key: string;
  mime_type: string;
  /** bigint dari pg — datang sebagai string. */
  size: string;
  bucket: string;
  public_url: string;
  created_at: string;
}

export interface PresignResult {
  uploadUrl: string;
  objectKey: string;
  method: "PUT";
  expiresInSeconds: number;
  headers: Record<string, string>;
}

export interface ArticleListQuery {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  article_type?: ArticleType;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}
