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
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-amber-500" />
      <div>
        <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {error.message || "Halaman gagal dimuat. Coba ulangi beberapa saat."}
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
