import Link from "next/link";
import { BrandMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Empty state branded (redesign §52): logo K</> + copy editorial,
 * bukan "No data found" generik.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      <BrandMark size={44} />
      <div className="space-y-1">
        <p className="text-base font-semibold tracking-tight">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && actionHref && (
        <Button asChild className="mt-1">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button className="mt-1" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
