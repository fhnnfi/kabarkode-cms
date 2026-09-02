"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useArticle } from "@/features/articles/hooks";
import { ArticleForm } from "@/features/articles/components/article-form";

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useArticle(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat artikel</AlertTitle>
        <AlertDescription>
          Artikel tidak ditemukan atau terjadi kesalahan.{" "}
          <Button variant="link" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <ArticleForm article={data} />;
}
