"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";
import { Spinner } from "@/components/ui/spinner";

/**
 * Guard sisi klien (requirement §57). Lapisan: proxy() untuk redirect awal,
 * guard ini untuk state auth yang sebenarnya, backend untuk otoritas final.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Memuat sesi">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
