import { getPostBySlug } from "@/lib/actions/blog.actions"
import { getUser } from "@/lib/actions/auth.actions"
import { notFound } from "next/navigation"
import { PostDetailContainer } from "@/components/post-detail-container"

export const dynamic = "force-dynamic"

interface PostPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const profile = await getUser()

  return <PostDetailContainer post={post} currentUserId={profile?.id} />
}
