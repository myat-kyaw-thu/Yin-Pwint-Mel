"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import BlogFeed from "@/components/blog/blog-feed";
import HomeLayout from "@/components/layout/home-layout";
import FollowingList from "@/components/user/following-list";
import SuggestedUsers from "@/components/user/suggested-users";
import UserProfileCard from "@/components/user/user-profile-card";
import { blogController, type Blog } from "@/controller/blogController";
import {
  userController,
  type SuggestedUser,
  type User,
} from "@/controller/userController";
import useStore from "@/lib/store";

interface FollowingUser extends User {
  profile?: {
    id?: string;
    bio?: string | null;
    pfp?: string | null;
    website?: string | null;
    birthdate?: string | null;
  } | null;
}

export default function HomePage({ params }: { params: { username: string } }) {
  const username = params.username;
  const router = useRouter();
  const { data: session, status } = useSession();

  // Global state from store
  const {
    currentUser,
    setCurrentUser,
    getFeedBlogs,
    setFeedBlogs,
    getFollowingUsers,
    setFollowingUsers,
    suggestedUsers,
    setSuggestedUsers,
  } = useStore();

  // Local state
  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [followingUsers, setLocalFollowingUsers] = useState<FollowingUser[]>(
    []
  );
  const [localSuggestedUsers, setLocalSuggestedUsers] = useState<
    SuggestedUser[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Use refs to track initialization state
  const isInitialized = useRef(false);
  const currentUsername = useRef(username);

  // Load more blogs function for infinite scrolling
  const loadMoreBlogs = useCallback(async () => {
    if (!hasMore || !nextCursor || !user?.id) return;

    try {
      const response = await blogController.getFeedBlogs(user.id, nextCursor);

      if (response && response.data) {
        const newBlogs = [...blogs, ...response.data];
        setBlogs(newBlogs);
        setHasMore(response.pagination.hasMore);
        setNextCursor(response.pagination.nextCursor);

        // Update cache with the new combined data
        setFeedBlogs(user.id, newBlogs, {
          hasMore: response.pagination.hasMore,
          nextCursor: response.pagination.nextCursor,
        });
      }
    } catch (error) {
      console.error("Error loading more blogs:", error);
    }
  }, [hasMore, nextCursor, user?.id, blogs, setFeedBlogs]);

  // Main data fetching effect
  useEffect(() => {
    // If username changes, reset initialization
    if (currentUsername.current !== username) {
      isInitialized.current = false;
      currentUsername.current = username;
    }

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

        // Verify the username in the URL matches the user
        if (userData.username !== username) {
          router.push(`/home/${userData.username}`);
          return;
        }

        // Set user data
        setUser(userData);

        // Only proceed if we have a valid user ID
        if (userData.id) {
          // 1. Fetch blogs - check cache first
          const cachedBlogs = getFeedBlogs(userData.id);

          if (cachedBlogs) {
            // Use cached data
            setBlogs(cachedBlogs.data);
            setHasMore(cachedBlogs.pagination.hasMore);
            setNextCursor(cachedBlogs.pagination.nextCursor);
          } else {
            // Fetch from API
            try {
              const blogsResponse = await blogController.getFeedBlogs(
                userData.id
              );
              if (blogsResponse && blogsResponse.data) {
                setBlogs(blogsResponse.data);
                setHasMore(blogsResponse.pagination.hasMore);
                setNextCursor(blogsResponse.pagination.nextCursor);

                // Save to cache
                setFeedBlogs(userData.id, blogsResponse.data, {
                  hasMore: blogsResponse.pagination.hasMore,
                  nextCursor: blogsResponse.pagination.nextCursor,
                });
              }
            } catch (error) {
              console.error("Error fetching blogs:", error);
              setBlogs([]);
            }
          }

          // 2. Fetch following users - check cache first
          const cachedFollowing = getFollowingUsers(userData.id);

          if (cachedFollowing) {
            // Use cached data
            setLocalFollowingUsers(cachedFollowing.data);
          } else {
            // Fetch from API
            try {
              const response = await fetch(
                `/api/user/username/${username}/following`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userData.id,
                  },
                }
              );

              if (!response.ok) {
                throw new Error("Failed to fetch following users");
              }

              const data = await response.json();
              const followingData = data.following || [];
              setLocalFollowingUsers(followingData);

              // Save to cache
              setFollowingUsers(userData.id, followingData);
            } catch (error) {
              console.error("Error fetching following users:", error);
              setLocalFollowingUsers([]);
            }
          }

          // 3. Fetch suggested users - check cache first
          if (
            suggestedUsers &&
            suggestedUsers.timestamp > Date.now() - 5 * 60 * 1000
          ) {
            // Use cached data
            setLocalSuggestedUsers(suggestedUsers.data);
          } else {
            // Fetch from API
            try {
              const suggestedUsersData = await userController.getSuggestedUsers(
                userData.id,
                5
              );
              setLocalSuggestedUsers(suggestedUsersData || []);

              // Save to cache
              setSuggestedUsers(suggestedUsersData || []);
            } catch (error) {
              console.error("Error fetching suggested users:", error);
              setLocalSuggestedUsers([]);
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
    username,
    router,
    session,
    status,
    currentUser,
    setCurrentUser,
    getFeedBlogs,
    setFeedBlogs,
    getFollowingUsers,
    setFollowingUsers,
    suggestedUsers,
    setSuggestedUsers,
  ]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will never render as we redirect in the catch block
  }

  return (
    <HomeLayout user={user}>
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        {/* Following users list */}
        <FollowingList
          users={followingUsers.map(({ id, username, email }) => ({
            id,
            username,
            email,
          }))}
        />

        {/* Main content area */}
        <div className="flex gap-8 mt-6">
          {/* Blog feed */}
          <div className="flex-1">
            <BlogFeed
              blogs={blogs}
              currentUser={user}
              hasMore={hasMore}
              onLoadMore={loadMoreBlogs}
            />
          </div>

          {/* Right sidebar */}
          <div className="w-80 hidden lg:block">
            <div className="sticky top-4 space-y-6">
              <UserProfileCard user={user} />
              <SuggestedUsers
                users={localSuggestedUsers.map((user) => ({
                  ...user,
                  isFollowing: user.isFollowing ?? false,
                }))}
                currentUserId={user.id}
              />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
