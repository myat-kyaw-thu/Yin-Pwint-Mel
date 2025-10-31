import { BlogForm } from "@/components/blog-form"
import { getUser } from "@/lib/actions/auth.actions"
import { redirect } from "next/navigation"

export default async function NewBlogPage() {
  const profile = await getUser()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <BlogForm authorId={profile.id} />
      </main>
    </div>
  )
}
