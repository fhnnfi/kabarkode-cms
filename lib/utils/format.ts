import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function formatBytes(bytes: number | string): string {
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(iso: string | null | undefined, pattern = "d MMM yyyy, HH:mm"): string {
  if (!iso) return "—";
  try {
    return format(new Date(iso), pattern, { locale: localeId });
  } catch {
    return "—";
  }
}
