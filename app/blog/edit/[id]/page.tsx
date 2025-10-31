import { BlogForm } from "@/components/blog-form"
import { getPostById } from "@/lib/actions/blog.actions"
import { getUser } from "@/lib/actions/auth.actions"
import { notFound, redirect } from "next/navigation"

interface EditBlogPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = await params
  const post = await getPostById(id)

  if (!post) {
    notFound()
  }

  const profile = await getUser()

  if (!profile) {
    redirect("/auth/login")
  }

  // Check if user owns this post
  if (post.author_id !== profile.id) {
    redirect("/")
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <BlogForm post={post} authorId={post.author_id} />
      </main>
    </div>
  )
}
