"use client";

/**
 * Store kecil "ada perubahan belum disimpan" — dipakai article editor untuk
 * menandai dirty dan dipakai NavigationGuard untuk menahan semua link SPA
 * (breadcrumb, sidebar, palette) saat keluar halaman.
 */
let dirty = false;
const listeners = new Set<() => void>();

export function setUnsavedDirty(value: boolean): void {
  if (dirty === value) return;
  dirty = value;
  listeners.forEach((l) => l());
}

export function isUnsavedDirty(): boolean {
  return dirty;
}

export function subscribeUnsaved(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
