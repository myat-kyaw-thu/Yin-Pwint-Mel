import BlogDetailContent from "@/components/blog/blog-detail-content";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Suspense } from "react";

interface BlogDetailPageProps {
  params: {
    id: string;
  };
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BlogDetailContent blogId={params.id} />
    </Suspense>
  );
}
