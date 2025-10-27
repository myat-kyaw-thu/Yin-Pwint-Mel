import { PostCard } from "@/components/post-card"
import type { Post } from "@/types/database"
import Link from "next/link"

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <Link key={post.id} href={`/${post.slug}`} className="block">
          <PostCard post={post} />
        </Link>
      ))}
    </div>
  )
}
