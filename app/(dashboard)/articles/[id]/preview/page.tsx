"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useArticle } from "@/features/articles/hooks";
import { ArticleDetail } from "@/features/articles/components/article-detail";

/** Preview standalone — layout bersih seperti tampilan publik (§37). */
export default function ArticlePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useArticle(id);

  if (isLoading) return <Skeleton className="mx-auto h-[80vh] max-w-3xl" />;
  if (isError || !data) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertTitle>Gagal memuat preview</AlertTitle>
        <AlertDescription>
          <Button variant="link" size="sm" onClick={() => refetch()}>Coba lagi</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-svh bg-background p-6 md:p-12">
      <ArticleDetail article={data} />
    </div>
  );
}
