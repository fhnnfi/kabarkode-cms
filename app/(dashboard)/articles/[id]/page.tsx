"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useArticle } from "@/features/articles/hooks";
import { ArticleDetail } from "@/features/articles/components/article-detail";

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useArticle(id);

  if (isLoading) return <Skeleton className="h-[60vh] w-full" />;
  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat artikel</AlertTitle>
        <AlertDescription>
          <Button variant="link" size="sm" onClick={() => refetch()}>Coba lagi</Button>
        </AlertDescription>
      </Alert>
    );
  }
  return <ArticleDetail article={data} />;
}
