/* eslint-disable @next/next/no-img-element */
"use client";

import { formatDistanceToNow } from "date-fns";
import {
  BookmarkPlus,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { blogController } from "@/controller/blogController";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string;
  profile?: {
    pfp?: string | null;
    bio?: string | null;
  } | null;
}

interface Blog {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  images: {
    id: string;
    url: string;
    blogId: string;
  }[];
  tags: {
    id: string;
    blogId: string;
    tagId: string;
    tag: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
  isFavorited?: boolean;
}

interface BlogCardProps {
  blog: Blog;
  currentUser: User;
  onLikeChange?: (blogId: string, liked: boolean) => void;
  onFavoriteChange?: (blogId: string, favorited: boolean) => void;
}

export default function BlogCard({
  blog,
  currentUser,
  onLikeChange,
  onFavoriteChange,
}: BlogCardProps) {
  // Initialize state from props, but don't update when props change
  // This prevents unnecessary re-renders and API calls
  const [liked, setLiked] = useState(blog.isLiked || false);
  const [saved, setSaved] = useState(blog.isFavorited || false);
  const [likeCount, setLikeCount] = useState(blog._count.likes);

  // Memoized handlers to prevent recreating on each render
  const handleLike = useCallback(async () => {
    if (!currentUser?.id) {
      console.error("User ID is missing. Cannot toggle like.");
      return;
    }

    try {
      // Optimistic update
      const newLikedState = !liked;
      const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;

      setLiked(newLikedState);
      setLikeCount(newLikeCount);

      // Call API
      const result = await blogController.toggleLike(currentUser.id, blog.id);

      // Notify parent component if callback provided
      if (onLikeChange) {
        onLikeChange(blog.id, result.liked);
      }

      // Revert if API call returns different result
      if (result.liked !== newLikedState) {
        setLiked(result.liked);
        setLikeCount(result.liked ? likeCount + 1 : likeCount - 1);
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling like:", error);
      setLiked(!liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
    }
  }, [blog.id, currentUser?.id, liked, likeCount, onLikeChange]);

  const handleSave = useCallback(async () => {
    if (!currentUser?.id) {
      console.error("User ID is missing. Cannot toggle favorite.");
      return;
    }

    try {
      // Optimistic update
      const newSavedState = !saved;
      setSaved(newSavedState);

      // Call API
      const result = await blogController.toggleFavorite(
        currentUser.id,
        blog.id
      );

      // Notify parent component if callback provided
      if (onFavoriteChange) {
        onFavoriteChange(blog.id, result.favorited);
      }

      // Revert if API call returns different result
      if (result.favorited !== newSavedState) {
        setSaved(result.favorited);
      }
    } catch (error) {
      // Revert on error
      console.error("Error toggling favorite:", error);
      setSaved(!saved);
    }
  }, [blog.id, currentUser?.id, saved, onFavoriteChange]);

  // Update local state if the blog prop changes significantly
  // This is important for virtual lists or when the same component is reused
  useEffect(() => {
    // Only update if the blog ID changes or if isLiked/isFavorited are explicitly defined
    // This prevents unnecessary state updates and re-renders
    if (
      (blog.isLiked !== undefined && blog.isLiked !== liked) ||
      (blog.isFavorited !== undefined && blog.isFavorited !== saved) ||
      blog._count.likes !== likeCount
    ) {
      setLiked(blog.isLiked || false);
      setSaved(blog.isFavorited || false);
      setLikeCount(blog._count.likes);
    }
  }, [
    blog.id,
    blog.isLiked,
    blog.isFavorited,
    blog._count.likes,
    liked,
    saved,
    likeCount,
  ]);

  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={blog.author.profile?.pfp || undefined}
                alt={blog.author.username}
              />
              <AvatarFallback>
                {blog.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/profile/${blog.author.username}`}
                className="font-medium text-gray-900 hover:underline"
              >
                {blog.author.username}
              </Link>
              {blog.author.id === currentUser.id && (
                <span className="ml-2 text-xs text-gray-500">(You)</span>
              )}
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
          {blog.subtitle && (
            <p className="text-gray-700 mb-2 italic">{blog.subtitle}</p>
          )}
          <p className="text-gray-600 mb-3 line-clamp-3">{blog.description}</p>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {blog.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="bg-gray-100 text-gray-700"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Read more link */}
          <Link
            href={`/blog/${blog.id}`}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
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
              <Heart
                className={cn("h-5 w-5", liked && "fill-red-500 text-red-500")}
              />
              <span>{likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-gray-700"
              asChild
            >
              <Link href={`/blog/${blog.id}#comments`}>
                <MessageSquare className="h-5 w-5" />
                <span>{blog._count.comments}</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 text-gray-700"
              asChild
            >
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
            <BookmarkPlus
              className={cn("h-5 w-5", saved && "fill-yellow-500")}
            />
          </Button>
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-gray-500 w-full text-left">
          {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  );
}
