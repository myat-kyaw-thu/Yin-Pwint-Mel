"use client";

import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import BlogCard from "@/components/blog/blog-card";
import HomeLayout from "@/components/layout/home-layout";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { blogController, type Blog } from "@/controller/blogController";
import { userController, type User } from "@/controller/userController";
import { useToast } from "@/hook/use-toast";
import useStore from "@/lib/store";

export default function SavedPostsContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Global state from store
  const { currentUser, setCurrentUser, getSavedBlogs, setSavedBlogs } =
    useStore();

  // Local state
  const [user, setUser] = useState<User | null>(null);
  const [savedBlogs, setSavedBlogsLocal] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Use refs to track initialization state
  const isInitialized = useRef(false);
  const dataFetchedRef = useRef(false);

  // Load more blogs function for infinite scrolling
  const loadMoreBlogs = useCallback(async () => {
    if (!hasMore || !nextCursor || !user?.id || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await blogController.getSavedBlogs(user.id, nextCursor);

      if (response && response.data) {
        const newBlogs = [...savedBlogs, ...response.data];
        setSavedBlogsLocal(newBlogs);
        setHasMore(response.pagination.hasMore);
        setNextCursor(response.pagination.nextCursor);

        // Update cache with the new combined data
        setSavedBlogs(user.id, newBlogs, {
          hasMore: response.pagination.hasMore,
          nextCursor: response.pagination.nextCursor,
        });
      }
    } catch (error) {
      console.error("Error loading more saved blogs:", error);
      toast({
        title: "Error",
        description: "Failed to load more saved posts",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    nextCursor,
    user?.id,
    loadingMore,
    savedBlogs,
    setSavedBlogs,
    toast,
  ]);

  // Handle unfavorite/unsave blog
  const handleUnfavorite = useCallback(
    (blogId: string, favorited: boolean) => {
      if (!favorited) {
        // If the blog was unfavorited, remove it from the list
        setSavedBlogsLocal((prev) => prev.filter((blog) => blog.id !== blogId));

        // Also update the store
        if (user?.id) {
          const cachedBlogs = getSavedBlogs(user.id);
          if (cachedBlogs) {
            const updatedBlogs = cachedBlogs.data.filter(
              (blog) => blog.id !== blogId
            );
            setSavedBlogs(user.id, updatedBlogs, cachedBlogs.pagination);
          }
        }
      }
    },
    [getSavedBlogs, setSavedBlogs, user?.id]
  );

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

        // Check if we already have the current user in the store
        let userData = currentUser;

        // If not, fetch from API
        if (!userData) {
          userData = await userController.getUserByEmail(session.user.email);
          if (!userData) {
            throw new Error("Failed to fetch user data");
          }
          // Save to store
          setCurrentUser(userData);
        }

        // Set user data
        setUser(userData);

        // Only proceed if we have a valid user ID
        if (userData.id) {
          // Fetch saved blogs - check cache first
          if (!dataFetchedRef.current) {
            const cachedBlogs = getSavedBlogs(userData.id);

            if (cachedBlogs) {
              // Use cached data
              setSavedBlogsLocal(cachedBlogs.data);
              setHasMore(cachedBlogs.pagination.hasMore);
              setNextCursor(cachedBlogs.pagination.nextCursor);
              dataFetchedRef.current = true;
            } else {
              // Fetch from API
              try {
                const blogsResponse = await blogController.getSavedBlogs(
                  userData.id
                );
                if (blogsResponse && blogsResponse.data) {
                  setSavedBlogsLocal(blogsResponse.data);
                  setHasMore(blogsResponse.pagination.hasMore);
                  setNextCursor(blogsResponse.pagination.nextCursor);
                  dataFetchedRef.current = true;

                  // Save to cache
                  setSavedBlogs(userData.id, blogsResponse.data, {
                    hasMore: blogsResponse.pagination.hasMore,
                    nextCursor: blogsResponse.pagination.nextCursor,
                  });
                }
              } catch (error) {
                console.error("Error fetching saved blogs:", error);
                setSavedBlogsLocal([]);
              }
            }
          }
        } else {
          console.error("User ID is missing");
        }

        // Mark as initialized
        isInitialized.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth/login");
      }
    }

    fetchData();
  }, [
    router,
    session,
    status,
    currentUser,
    setCurrentUser,
    getSavedBlogs,
    setSavedBlogs,
  ]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null; // This will never render as we redirect in the catch block
  }

  return (
    <HomeLayout user={user}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="h-6 w-6" />
            Saved Posts
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Posts you have saved for later. Only you can see these.
          </p>
        </div>

        {savedBlogs.length > 0 ? (
          <div className="space-y-6">
            {/* Blog Grid - Changed to 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedBlogs.map((blog) => (
                <div key={blog.id} className="col-span-1">
                  <BlogCard
                    blog={blog}
                    currentUser={user}
                    onFavoriteChange={handleUnfavorite}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMoreBlogs}
                  disabled={loadingMore}
                  className="w-full max-w-xs"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Saved Posts Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              When you save posts, they all appear here for you to read later.
            </p>
            <Button onClick={() => router.push("/")}>Browse Posts</Button>
          </div>
        )}
      </div>
    </HomeLayout>
  );
}
