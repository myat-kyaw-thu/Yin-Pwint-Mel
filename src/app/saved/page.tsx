import SavedPostsContent from "@/components/blog/saved-posts-content";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Suspense } from "react";

export default function SavedPostsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SavedPostsContent />
    </Suspense>
  );
}
