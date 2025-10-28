import { PostListContainer } from "@/components/post-list-container"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  return <PostListContainer />
}
