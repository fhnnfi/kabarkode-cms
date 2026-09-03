import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <BrandMark size={48} />
      <h1 className="font-mono text-2xl font-bold tracking-tight">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Halaman yang kamu cari tidak ditemukan. Mungkin sudah diarsipkan atau dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
