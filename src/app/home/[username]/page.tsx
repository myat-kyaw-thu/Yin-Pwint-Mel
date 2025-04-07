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

  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Use refs to track initialization state instead of state variables
  // to avoid re-renders and infinite loops
  const isInitialized = useRef(false);
  const currentUsername = useRef(username);

  // Load more blogs function for infinite scrolling
  const loadMoreBlogs = useCallback(async () => {
    if (!hasMore || !nextCursor || !user?.id) return;

    try {
      const response = await blogController.getFeedBlogs(user.id, nextCursor);

      if (response && response.data) {
        setBlogs((prevBlogs) => [...prevBlogs, ...response.data]);
        setHasMore(response.pagination.hasMore);
        setNextCursor(response.pagination.nextCursor);
      }
    } catch (error) {
      console.error("Error loading more blogs:", error);
    }
  }, [hasMore, nextCursor, user?.id]);

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

        // Use userController to fetch user data
        const userData = await userController.getUserByEmail(
          session.user.email
        );

        if (!userData) {
          throw new Error("Failed to fetch user data");
        }

        // Verify the username in the URL matches the fetched user
        if (userData.username !== username) {
          router.push(`/home/${userData.username}`);
          return;
        }

        // Set user data
        setUser(userData);

        // Only proceed if we have a valid user ID
        if (userData.id) {
          // Fetch blogs
          try {
            const blogsResponse = await blogController.getFeedBlogs(
              userData.id
            );
            if (blogsResponse && blogsResponse.data) {
              setBlogs(blogsResponse.data);
              setHasMore(blogsResponse.pagination.hasMore);
              setNextCursor(blogsResponse.pagination.nextCursor);
            }
          } catch (error) {
            console.error("Error fetching blogs:", error);
            setBlogs([]);
          }

          // Fetch following users
          try {
            const response = await fetch(
              `/api/user/username/${username}/following`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              throw new Error("Failed to fetch following users");
            }

            const data = await response.json();
            setFollowingUsers(data.following || []);
          } catch (error) {
            console.error("Error fetching following users:", error);
            setFollowingUsers([]);
          }

          // Fetch suggested users
          try {
            const suggestedUsersData =
              await userController.getSuggestedUsers(5);
            setSuggestedUsers(suggestedUsersData || []);
          } catch (error) {
            console.error("Error fetching suggested users:", error);
            setSuggestedUsers([]);
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
  }, [username, router, session, status]);

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
              <SuggestedUsers users={suggestedUsers} currentUserId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
