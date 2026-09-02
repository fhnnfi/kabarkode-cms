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

export function can(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (role === "admin" ? ALL : EDITOR).includes(permission);
}
