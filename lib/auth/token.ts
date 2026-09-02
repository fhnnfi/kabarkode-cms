/**
 * Penyimpanan token terpusat (requirement §11).
 *
 * Backend saat ini hanya mendukung Bearer JWT (belum ada cookie auth),
 * jadi dipakai adapter klien: token disimpan di COOKIE non-httpOnly.
 * Cookie dipilih daripada localStorage karena ikut aturan SameSite dan
 * bisa dibaca Next.js proxy() untuk redirect awal. Penanganan token
 * TIDAK boleh tersebar di komponen — semua lewat modul ini.
 */
const COOKIE = "kk_cms_token";
const MAX_AGE = 7 * 24 * 60 * 60; // selaras JWT_EXPIRES_IN default backend (7d)

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  emit();
}

export function clearToken(): void {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`;
  emit();
}

/* --- event kecil agar AuthProvider & client sinkron saat token berubah --- */
type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
