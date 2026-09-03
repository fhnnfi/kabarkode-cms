import { cn } from "@/lib/utils";

/**
 * Brand mark KabarKode (redesign §4–§6): kotak hitam dengan "K</>" putih,
 * monospace-inspired, radius 12px. `</>` menyatu dengan K sebagai satu lockup.
 */
export function BrandMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-black font-mono font-bold text-white select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      K<span className="opacity-90">&lt;/&gt;</span>
    </span>
  );
}

/** Lockup logo + wordmark untuk sidebar/login. */
export function BrandLockup({
  className,
  size = 36,
  subtitle,
}: {
  className?: string;
  size?: number;
  subtitle?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <span className="grid flex-1 text-left leading-tight">
        <span className="truncate text-sm font-bold tracking-tight">KabarKode</span>
        {subtitle && (
          <span className="truncate font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
