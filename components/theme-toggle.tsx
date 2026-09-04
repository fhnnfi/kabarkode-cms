"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** Toggle gelap/terang — mengikuti siklus light → dark → system. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Ganti tema (saat ini: ${resolvedTheme === "dark" ? "gelap" : "terang"})`}
      title={resolvedTheme === "dark" ? "Mode gelap — klik untuk terang" : "Mode terang — klik untuk gelap"}
      className={`kk-transition size-9 rounded-lg ${className ?? ""}`}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
