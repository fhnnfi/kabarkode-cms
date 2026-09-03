"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  // §54: jangan paparkan pesan teknis/stack trace ke user — error hanya di-log.
  if (process.env.NODE_ENV !== "production") console.error(error);
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold">Something went wrong.</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Kami tidak bisa memuat halaman ini. Coba ulangi beberapa saat.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Coba lagi</Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
}
