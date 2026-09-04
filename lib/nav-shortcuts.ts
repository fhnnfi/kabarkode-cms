/** Shortcut navigasi global (redesign §42): Ctrl/Cmd+1..3 + Ctrl/Cmd+Shift+A. */
export const NAV_SHORTCUTS: { keys: string; label: string; href: string; combo: string }[] = [
  { keys: "1", label: "Dashboard", href: "/dashboard", combo: "⌘1" },
  { keys: "2", label: "Articles", href: "/articles", combo: "⌘2" },
  { keys: "3", label: "Media / Upload", href: "/media", combo: "⌘3" },
  { keys: "A", label: "New Article", href: "/articles/new", combo: "⌘⇧A" },
];
