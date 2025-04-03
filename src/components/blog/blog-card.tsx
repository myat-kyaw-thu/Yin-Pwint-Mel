"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { BookmarkPlus, Heart, MessageSquare, MoreHorizontal, Share2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface User {
  id: string
  username: string
  email: string
  profile?: {
    pfp?: string | null
    bio?: string | null
  } | null
}

interface Blog {
  id: string
  title: string
  subtitle?: string
  description: string
  content: string
  visibility: string
  createdAt: string
  updatedAt: string
  authorId: string
  author: User
  images: {
    id: string
    url: string
    blogId: string
  }[]
  tags: {
    id: string
    blogId: string
    tagId: string
    tag: {
      id: string
      name: string
    }
  }[]
  _count: {
    comments: number
    likes: number
  }
}

interface BlogCardProps {
  blog: Blog
  currentUser: User
}

export default function BlogCard({ blog, currentUser }: BlogCardProps) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(blog._count.likes)

  const handleLike = async () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    // Here you would make an API call to update the like status
    // await fetch(`/api/blogs/${blog.id}/like`, { method: 'POST' });
  }

  const handleSave = async () => {
    setSaved(!saved)

    // Here you would make an API call to update the save status
    // await fetch(`/api/blogs/${blog.id}/save`, { method: 'POST' });
  }

  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={blog.author.profile?.pfp || undefined} alt={blog.author.username} />
              <AvatarFallback>{blog.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/profile/${blog.author.username}`} className="font-medium text-gray-900 hover:underline">
                {blog.author.username}
              </Link>
              {blog.author.id === currentUser.id && <span className="ml-2 text-xs text-gray-500">(You)</span>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Featured image */}
        {blog.images.length > 0 && (
          <div className="relative aspect-[4/3] bg-gray-100">
            <img
              src={blog.images[0].url || "/placeholder.svg"}
              alt={blog.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        {/* Blog content */}
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{blog.title}</h3>
          {blog.subtitle && <p className="text-gray-700 mb-2 italic">{blog.subtitle}</p>}
          <p className="text-gray-600 mb-3 line-clamp-3">{blog.description}</p>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.map(({ tag }) => (
                <Badge key={tag.id} variant="outline" className="bg-gray-100 text-gray-700">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Read more link */}
          <Link href={`/blog/${blog.id}`} className="text-blue-600 hover:underline text-sm font-medium">
            Read more
          </Link>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-white border-t border-gray-100 flex flex-col">
        {/* Action buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-gray-700"
              onClick={handleLike}
            >
              <Heart className={cn("h-5 w-5", liked && "fill-red-500 text-red-500")} />
              <span>{likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-700" asChild>
              <Link href={`/blog/${blog.id}#comments`}>
                <MessageSquare className="h-5 w-5" />
                <span>{blog._count.comments}</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-gray-700" asChild>
              <Link href={`/share/${blog.id}`}>
                <Share2 className="h-5 w-5" />
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-gray-700", saved && "text-yellow-500")}
            onClick={handleSave}
          >
            <BookmarkPlus className={cn("h-5 w-5", saved && "fill-yellow-500")} />
          </Button>
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-gray-500 w-full text-left">
          {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  )
}

