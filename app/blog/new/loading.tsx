import { BlogFormSkeleton } from "@/components/blog-form-skeleton"

export default function NewBlogLoading() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <BlogFormSkeleton />
      </main>
    </div>
  )
}
