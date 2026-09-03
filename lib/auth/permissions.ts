import type { UserRole } from "@/types/models";

/**
 * Permission map untuk UI (requirement §13).
 * Ini HANYA untuk menyembunyikan aksi yang tidak bisa dilakukan role —
 * backend tetap otoritas final (401/403 selalu mungkin terjadi).
 */
export type Permission =
  | "view_dashboard"
  | "manage_articles"
  | "publish_articles"
  | "archive_articles"
  | "delete_articles"
  | "manage_categories"
  | "manage_tags"
  | "manage_authors"
  | "manage_media";

const ALL: Permission[] = [
  "view_dashboard",
  "manage_articles",
  "publish_articles",
  "archive_articles",
  "delete_articles",
  "manage_categories",
  "manage_tags",
  "manage_authors",
  "manage_media",
];

const EDITOR: Permission[] = [
  "view_dashboard",
  "manage_articles",
  "publish_articles",
  "archive_articles",
  "manage_categories",
  "manage_tags",
  "manage_authors",
  "manage_media",
];

// Role 'author' (akun penulis dari halaman Authors): menulis & menerbitkan
// artikel sendiri + upload media. Backend otoritas final (403 tetap mungkin).
const AUTHOR: Permission[] = [
  "view_dashboard",
  "manage_articles",
  "publish_articles",
  "archive_articles",
  "manage_media",
];

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  if (role === "admin") return ALL.includes(permission);
  if (role === "author") return AUTHOR.includes(permission);
  return EDITOR.includes(permission);
}
