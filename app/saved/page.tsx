import { SavedPostsContainer } from "@/components/saved-posts-container"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SavedPostsPage() {
    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-4">
                <Link href="/">
                    <Button variant="ghost" className="rounded-none px-4 py-2 h-auto hover:bg-muted mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to posts
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Saved Posts</h1>
                <p className="text-muted-foreground mt-2">Your bookmarked articles</p>
            </div>
            <SavedPostsContainer />
        </div>
    )
}
