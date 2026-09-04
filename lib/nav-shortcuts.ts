/**
 * Shortcut navigasi global (redesign §42).
 *
 * sengaja memakai ALT, bukan Ctrl/Cmd+angka: di Chrome/Edge Windows
 * Ctrl+1..9 dan Ctrl+Shift+A adalah shortcut bawaan browser (pindah tab /
 * incognito) yang TIDAK bisa di-intercept oleh web app. Alt+kombinasi bebas.
 */
export const NAV_SHORTCUTS: { keys: string; label: string; href: string }[] = [
  { keys: "1", label: "Dashboard", href: "/dashboard" },
  { keys: "2", label: "Articles", href: "/articles" },
  { keys: "3", label: "Media / Upload", href: "/media" },
  { keys: "N", label: "New Article", href: "/articles/new" },
];

/** Label shortcut per platform: Mac memakai simbol Cmd/Option, selain itu Ctrl/Alt. */
export function shortcutLabel(keys: string, mac: boolean): string {
  return mac ? `\u2325${keys}` : `Alt+${keys}`;
}

export function paletteLabel(mac: boolean): string {
  return mac ? "\u2318K" : "Ctrl+K";
}
