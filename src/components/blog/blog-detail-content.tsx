"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import HomeLayout from "@/components/layout/home-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { blogController, type Blog } from "@/controller/blogController";
import { userController, type User } from "@/controller/userController";
import { useToast } from "@/hook/use-toast";
import useStore from "@/lib/store";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profile?: {
      pfp?: string | null;
    } | null;
  };
}

interface BlogDetailContentProps {
  blogId: string;
}

export default function BlogDetailContent({ blogId }: BlogDetailContentProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Get store functions
  const {
    currentUser,
    setCurrentUser,
    getBlogDetail,
    setBlogDetail,
    getBlogComments,
    setBlogComments,
    invalidateBlogDetail,
    invalidateBlogComments,
    invalidateFeedBlogs,
    invalidateUserBlogs,
  } = useStore();

  // State
  const [blog, setBlog] = useState<Blog | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);

  // Use refs to track initialization state to prevent multiple fetches
  const isInitialized = useRef(false);

  // Fetch comments with proper user ID header
  const fetchComments = useCallback(
    async (userId: string, page = 1) => {
      try {
        // Check cache first if it's the first page
        if (page === 1) {
          const cachedComments = getBlogComments(blogId);
          if (cachedComments) {
            setComments(cachedComments.comments);
            setCommentPage(cachedComments.pagination.page);
            setHasMoreComments(
              cachedComments.pagination.page <
                cachedComments.pagination.totalPages
            );
            return;
          }
        }

        // Fetch from API if not in cache or loading more pages
        const result = await blogController.getComments(blogId, page, userId);

        if (page === 1) {
          setComments(result.comments);
          // Save to cache only for first page
          setBlogComments(blogId, result.comments, {
            page: page,
            totalPages: result.pagination.totalPages,
          });
        } else {
          setComments((prev) => [...prev, ...result.comments]);
        }

        setCommentPage(page);
        setHasMoreComments(page < result.pagination.totalPages);
      } catch (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        });
      }
    },
    [blogId, toast, getBlogComments, setBlogComments]
  );

  // Load more comments
  const loadMoreComments = useCallback(async () => {
    if (loadingMoreComments || !hasMoreComments || !user?.id) return;

    setLoadingMoreComments(true);
    try {
      await fetchComments(user.id, commentPage + 1);
    } finally {
      setLoadingMoreComments(false);
    }
  }, [
    loadingMoreComments,
    hasMoreComments,
    user?.id,
    fetchComments,
    commentPage,
  ]);

  // Handle like with optimistic update
  const handleLike = useCallback(async () => {
    if (!user?.id || !blog) return;

    try {
      // Optimistic update
      const newLikedState = !blog.isLiked;
      const newLikeCount = blog._count.likes + (newLikedState ? 1 : -1);

      // Update UI immediately
      setBlog((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isLiked: newLikedState,
          _count: {
            ...prev._count,
            likes: newLikeCount,
          },
        };
      });

      // Call API
      const result = await blogController.toggleLike(user.id, blogId);

      // Revert if API call returns different result
      if (result.liked !== newLikedState) {
        setBlog((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isLiked: result.liked,
            _count: {
              ...prev._count,
              likes: prev._count.likes + (result.liked ? 1 : -1),
            },
          };
        });
      }

      // Invalidate caches since like status has changed
      invalidateBlogDetail(blogId);
      invalidateFeedBlogs(user.id);
      if (blog.authorId) {
        invalidateUserBlogs(blog.authorId);
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      // Revert on error
      setBlog((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isLiked: !blog.isLiked,
          _count: {
            ...prev._count,
            likes: prev._count.likes + (blog.isLiked ? 1 : -1),
          },
        };
      });

      toast({
        title: "Error",
        description: "Failed to like post",
        variant: "destructive",
      });
    }
  }, [
    user?.id,
    blog,
    blogId,
    toast,
    invalidateBlogDetail,
    invalidateFeedBlogs,
    invalidateUserBlogs,
  ]);

  // Handle favorite with optimistic update
  const handleFavorite = useCallback(async () => {
    if (!user?.id || !blog) return;

    try {
      // Optimistic update
      const newFavoritedState = !blog.isFavorited;

      // Update UI immediately
      setBlog((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isFavorited: newFavoritedState,
        };
      });

      // Call API
      const result = await blogController.toggleFavorite(user.id, blogId);

      // Revert if API call returns different result
      if (result.favorited !== newFavoritedState) {
        setBlog((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isFavorited: result.favorited,
          };
        });
      }

      // Invalidate caches
      invalidateBlogDetail(blogId);
      invalidateFeedBlogs(user.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);

      // Revert on error
      setBlog((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isFavorited: !blog.isFavorited,
        };
      });

      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    }
  }, [
    user?.id,
    blog,
    blogId,
    toast,
    invalidateBlogDetail,
    invalidateFeedBlogs,
  ]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!newComment.trim() || !user?.id) return;

    setSubmittingComment(true);
    try {
      const comment = await blogController.addComment(
        blogId,
        newComment,
        user.id
      );

      // Add the new comment to the list
      setComments((prev) => [comment, ...prev]);
      setNewComment("");

      // Update comment count in the blog object
      setBlog((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          _count: {
            ...prev._count,
            comments: prev._count.comments + 1,
          },
        };
      });

      // Invalidate comment cache
      invalidateBlogComments(blogId);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, user?.id, blogId, toast, invalidateBlogComments]);

  // Handle comment deletion
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!user?.id) return;

      try {
        const success = await blogController.deleteComment(
          blogId,
          commentId,
          user.id
        );

        if (success) {
          // Remove the comment from the list
          setComments((prev) =>
            prev.filter((comment) => comment.id !== commentId)
          );

          // Update comment count in the blog object
          setBlog((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              _count: {
                ...prev._count,
                comments: Math.max(0, prev._count.comments - 1),
              },
            };
          });

          toast({
            title: "Success",
            description: "Comment deleted successfully",
          });

          // Invalidate comment cache
          invalidateBlogComments(blogId);
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        });
      }
    },
    [user?.id, blogId, toast, invalidateBlogComments]
  );

  // Handle blog deletion
  const handleDeleteBlog = useCallback(async () => {
    if (!blog || !user?.id) return;

    if (
      window.confirm(
        "Are you sure you want to delete this blog post? This action cannot be undone."
      )
    ) {
      try {
        const success = await blogController.deleteBlog(blogId);

        if (success) {
          toast({
            title: "Success",
            description: "Blog post deleted successfully",
          });

          // Invalidate caches
          invalidateBlogDetail(blogId);
          invalidateFeedBlogs(user.id);
          if (blog.authorId) {
            invalidateUserBlogs(blog.authorId);
          }

          router.push("/");
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        toast({
          title: "Error",
          description: "Failed to delete blog post",
          variant: "destructive",
        });
      }
    }
  }, [
    blog,
    user?.id,
    blogId,
    router,
    toast,
    invalidateBlogDetail,
    invalidateFeedBlogs,
    invalidateUserBlogs,
  ]);

  // Focus comment input
  const handleCommentFocus = useCallback(() => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, []);

  // Image navigation
  const handleNextImage = useCallback(() => {
    if (blog?.images && blog.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % blog.images.length);
    }
  }, [blog?.images]);

  const handlePrevImage = useCallback(() => {
    if (blog?.images && blog.images.length > 1) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + blog.images.length) % blog.images.length
      );
    }
  }, [blog?.images]);

  // Main data fetching effect
  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // If still loading session, wait
    if (status === "loading") {
      return;
    }

    // If already initialized, don't fetch again
    if (isInitialized.current) {
      return;
    }

    // Fetch all data
    async function fetchData() {
      try {
        if (!session?.user?.email) {
          throw new Error("User email not available");
        }

        // 1. Get current user - check store first
        let userData = currentUser;

        if (!userData) {
          // Fetch from API if not in store
          userData = await userController.getUserByEmail(session.user.email);
          if (!userData) {
            throw new Error("Failed to fetch user data");
          }
          // Save to store
          setCurrentUser(userData);
        }

        setUser(userData);

        // 2. Fetch blog data - check cache first
        const cachedBlog = getBlogDetail(blogId);

        if (cachedBlog) {
          // Use cached data
          setBlog(cachedBlog.data);
        } else {
          // Fetch from API
          const blogData = await blogController.getBlogById(
            userData.id,
            blogId
          );

          if (!blogData) {
            router.push("/404");
            return;
          }

          setBlog(blogData);

          // Save to cache
          setBlogDetail(blogId, blogData);
        }

        // 3. Fetch comments - this will check cache internally
        await fetchComments(userData.id);

        // Mark as initialized to prevent multiple fetches
        isInitialized.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load blog data",
          variant: "destructive",
        });
        router.push("/");
      }
    }

    if (session?.user?.email) {
      fetchData();
    }
  }, [
    blogId,
    session,
    status,
    router,
    fetchComments,
    toast,
    currentUser,
    setCurrentUser,
    getBlogDetail,
    setBlogDetail,
  ]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!blog || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Blog not found</div>
      </div>
    );
  }

  return (
    <HomeLayout user={user}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          {/* Blog Header */}
          <CardHeader className="flex flex-row items-center p-4 space-y-0">
            <Link
              href={`/profile/${blog.author.username}`}
              className="flex items-center gap-2"
            >
              <Avatar className="w-10 h-10 border">
                <AvatarImage
                  src={blog.author.profile?.pfp || "/placeholder-user.jpg"}
                  alt={blog.author.username}
                />
                <AvatarFallback>
                  {blog.author.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm">
                  {blog.author.username}
                </div>
                <div className="text-xs text-gray-500">
                  {blog.createdAt &&
                    formatDistanceToNow(new Date(blog.createdAt), {
                      addSuffix: true,
                    })}
                </div>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto rounded-full"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleFavorite}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  {blog.isFavorited
                    ? "Remove from favorites"
                    : "Add to favorites"}
                </DropdownMenuItem>
                {blog.author.id === user.id && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push(`/blog/edit/${blogId}`)}
                    >
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={handleDeleteBlog}
                    >
                      Delete post
                    </DropdownMenuItem>
                  </>
                )}
                {blog.author.id !== user.id && (
                  <DropdownMenuItem className="text-red-500">
                    Report post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          {/* Blog Images */}
          <div className="relative">
            {blog.images && blog.images.length > 0 ? (
              <div className="aspect-square md:aspect-[4/3] relative overflow-hidden">
                <Image
                  src={
                    blog.images[currentImageIndex]?.url || "/placeholder.svg"
                  }
                  alt={blog.title}
                  fill
                  className="object-cover"
                />

                {blog.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white"
                    >
                      &#10094;
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 text-white"
                    >
                      &#10095;
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                      {blog.images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-gray-400"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-square md:aspect-[4/3] bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>

          {/* Blog Actions */}
          <div className="flex items-center p-4">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <Heart
                className={`w-6 h-6 ${blog.isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCommentFocus}>
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={handleFavorite}
            >
              <Bookmark
                className={`w-6 h-6 ${blog.isFavorited ? "fill-black" : ""}`}
              />
            </Button>
          </div>

          {/* Blog Content */}
          <CardContent className="px-4 py-0 space-y-2">
            {blog._count.likes > 0 && (
              <p className="font-semibold text-sm">{blog._count.likes} likes</p>
            )}

            <div>
              <h1 className="font-bold text-xl">{blog.title}</h1>
              {blog.subtitle && (
                <h2 className="text-gray-700 text-lg">{blog.subtitle}</h2>
              )}
            </div>

            <p className="text-sm whitespace-pre-line">{blog.content}</p>

            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {blog.tags.map((tagObj) => (
                  <Link
                    key={tagObj.id}
                    href={`/tag/${tagObj.tag.name}`}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    #{tagObj.tag.name}
                  </Link>
                ))}
              </div>
            )}

            <Separator className="my-4" />

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">
                Comments ({blog._count.comments})
              </h3>

              {/* Add Comment */}
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={user.profile?.pfp || "/placeholder-user.jpg"}
                    alt={user.username}
                  />
                  <AvatarFallback>
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Input
                  ref={commentInputRef}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim() || submittingComment}
                  variant="ghost"
                >
                  Post
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {comments.length > 0 ? (
                  <>
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={
                              comment.author.profile?.pfp ||
                              "/placeholder-user.jpg"
                            }
                            alt={comment.author.username}
                          />
                          <AvatarFallback>
                            {comment.author.username
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <Link
                              href={`/profile/${comment.author.username}`}
                              className="font-semibold text-sm hover:underline"
                            >
                              {comment.author.username}
                            </Link>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt &&
                                formatDistanceToNow(
                                  new Date(comment.createdAt),
                                  { addSuffix: true }
                                )}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            {comment.author.id === user.id && (
                              <button
                                className="hover:text-red-500"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMoreComments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-gray-500"
                        onClick={loadMoreComments}
                        disabled={loadingMoreComments}
                      >
                        {loadingMoreComments
                          ? "Loading..."
                          : "Load more comments"}
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 text-xs text-gray-500">
            Posted{" "}
            {blog.createdAt &&
              formatDistanceToNow(new Date(blog.createdAt), {
                addSuffix: true,
              })}
          </CardFooter>
        </Card>
      </div>
    </HomeLayout>
  );
}
