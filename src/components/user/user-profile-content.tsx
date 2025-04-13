"use client";

import { format } from "date-fns";
import {
  Bookmark,
  CalendarIcon,
  Edit,
  Globe,
  Grid3X3,
  MapPin,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import HomeLayout from "@/components/layout/home-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Blog } from "@/controller/blogController";
import { userController, type User } from "@/controller/userController";
import { useToast } from "@/hook/use-toast";
import useStore from "@/lib/store";
import BlogFeed from "../blog/blog-feed";
import ProfileEditForm from "./profile-edit-form";

interface UserProfileContentProps {
  username: string;
}

export default function UserProfileContent({
  username,
}: UserProfileContentProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  // Global state from store
  const {
    currentUser,
    setCurrentUser,
    getUserProfile,
    setUserProfile,
    getUserBlogs,
    setUserBlogs,
    getUserStats,
    setUserStats,
    getFollowStatus,
    setFollowStatus,
    invalidateUserStats,
  } = useStore();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [userBlogs, setLocalUserBlogs] = useState<Blog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Refs to prevent multiple API calls
  const isInitialized = useRef(false);
  const currentUsername = useRef(username);

  // Fetch user blogs
  const fetchUserBlogs = useCallback(
    async (userId: string, cursor?: string) => {
      try {
        const response = await userController.getUserBlogs(userId, cursor);

        if (response && response.data) {
          if (!cursor) {
            setLocalUserBlogs(response.data);

            // Update cache
            setUserBlogs(userId, response.data, {
              hasMore: response.pagination.hasMore,
              nextCursor: response.pagination.nextCursor,
            });
          } else {
            const newBlogs = [...userBlogs, ...response.data];
            setLocalUserBlogs(newBlogs);

            // Update cache with combined data
            setUserBlogs(userId, newBlogs, {
              hasMore: response.pagination.hasMore,
              nextCursor: response.pagination.nextCursor,
            });
          }

          setHasMore(response.pagination.hasMore);
          setNextCursor(response.pagination.nextCursor);
        }
      } catch (error) {
        console.error("Error fetching user blogs:", error);
        toast({
          title: "Error",
          description: "Failed to load user posts",
          variant: "destructive",
        });
      }
    },
    [toast, userBlogs, setUserBlogs]
  );

  // Load more blogs
  const loadMoreBlogs = useCallback(async () => {
    if (!hasMore || !nextCursor || !user?.id) return;

    await fetchUserBlogs(user.id, nextCursor);
  }, [fetchUserBlogs, hasMore, nextCursor, user?.id]);

  // Toggle follow status
  const toggleFollow = useCallback(async () => {
    if (!currentUserData?.id || !user?.id) return;

    try {
      // Optimistic update
      setIsFollowing((prev) => !prev);
      setStats((prev) => ({
        ...prev,
        followers: prev.followers + (isFollowing ? -1 : 1),
      }));

      // Call API
      const result = await userController.toggleFollow(currentUser.id, user.id);

      // If API returns different result, revert
      if (result.following !== !isFollowing) {
        setIsFollowing(result.following);
        setStats((prev) => ({
          ...prev,
          followers: prev.followers + (result.following ? 1 : -1),
        }));
      }

      // Update cache
      setFollowStatus(user.id, result.following);

      // Invalidate stats cache since follower count changed
      invalidateUserStats(user.id);
    } catch (error) {
      console.error("Error toggling follow:", error);

      // Revert on error
      setIsFollowing((prev) => !prev);
      setStats((prev) => ({
        ...prev,
        followers: prev.followers + (isFollowing ? 1 : -1),
      }));

      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  }, [
    currentUserData?.id,
    isFollowing,
    toast,
    user?.id,
    setFollowStatus,
    invalidateUserStats,
  ]);

  // Handle profile update
  const handleProfileUpdate = useCallback(
    (updatedUser: User) => {
      setUser(updatedUser);
      setShowEditForm(false);

      // Update cache
      setUserProfile(updatedUser.username, updatedUser);

      // If this is the current user, update that too
      if (isCurrentUser) {
        setCurrentUser(updatedUser);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // If username changed, redirect to new profile URL
      if (updatedUser.username !== username) {
        router.push(`/profile/${updatedUser.username}`);
      }
    },
    [router, toast, username, isCurrentUser, setUserProfile, setCurrentUser]
  );

  // Fetch user stats
  const fetchUserStats = useCallback(
    async (userId: string) => {
      try {
        // Check cache first
        const cachedStats = getUserStats(userId);

        if (cachedStats) {
          setStats({
            posts: cachedStats.posts,
            followers: cachedStats.followers,
            following: cachedStats.following,
          });
          return;
        }

        // Fetch from API if not in cache
        const response = await fetch(`/api/user/${userId}/stats`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user stats");
        }

        const result = await response.json();

        if (result.success) {
          const statsData = {
            posts: result.data?.posts || 0,
            followers: result.data?.followers || 0,
            following: result.data?.following || 0,
          };

          setStats(statsData);

          // Save to cache
          setUserStats(userId, statsData);
        }
      } catch (error) {
        console.error(`Error fetching stats for user ${userId}:`, error);
      }
    },
    [getUserStats, setUserStats]
  );

  // Check if current user is following profile user
  const checkFollowStatus = useCallback(
    async (userId: string) => {
      try {
        if (!currentUserData?.id) {
          console.error(
            "Cannot check follow status: current user ID is missing"
          );
          return;
        }

        // Check cache first
        const cachedStatus = getFollowStatus(userId);

        if (cachedStatus) {
          setIsFollowing(cachedStatus.following);
          return;
        }

        // Fetch from API if not in cache
        const isFollowing = await userController.isFollowing(
          userId,
          currentUserData.id
        );
        setIsFollowing(isFollowing);

        // Save to cache
        setFollowStatus(userId, isFollowing);
      } catch (error) {
        console.error(
          `Error checking follow status for user ${userId}:`,
          error
        );
      }
    },
    [currentUserData?.id, getFollowStatus, setFollowStatus]
  );

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

        // 1. Get current user (logged-in user)
        let loggedInUser = currentUser;

        if (!loggedInUser) {
          loggedInUser = await userController.getUserByEmail(
            session.user.email
          );
          if (!loggedInUser) {
            throw new Error("Failed to fetch current user data");
          }
          setCurrentUser(loggedInUser);
        }

        setCurrentUserData(loggedInUser);

        // 2. Get profile user (the user being viewed)
        // Check cache first
        let profileUser = getUserProfile(username);

        if (!profileUser) {
          // Fetch from API if not in cache
          profileUser = await userController.getUserByUsername(username);

          if (!profileUser) {
            router.push("/404");
            return;
          }

          // Save to cache
          setUserProfile(username, profileUser);
        }

        setUser(profileUser);

        // 3. Check if current user is viewing their own profile
        const isSameUser = loggedInUser.id === profileUser.id;
        setIsCurrentUser(isSameUser);

        // 4. If not viewing own profile, check follow status
        if (!isSameUser) {
          await checkFollowStatus(profileUser.id);
        }

        // 5. Fetch user stats
        await fetchUserStats(profileUser.id);

        // 6. Fetch user blogs - check cache first
        const cachedBlogs = getUserBlogs(profileUser.id);

        if (cachedBlogs) {
          // Use cached data
          setLocalUserBlogs(cachedBlogs.data);
          setHasMore(cachedBlogs.pagination.hasMore);
          setNextCursor(cachedBlogs.pagination.nextCursor);
        } else {
          // Fetch from API
          await fetchUserBlogs(profileUser.id);
        }

        // Mark as initialized
        isInitialized.current = true;
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        router.push("/");
      }
    }

    fetchData();
  }, [
    username,
    router,
    session,
    status,
    checkFollowStatus,
    fetchUserStats,
    fetchUserBlogs,
    toast,
    currentUser,
    setCurrentUser,
    getUserProfile,
    setUserProfile,
    getUserBlogs,
  ]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!user || !currentUserData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-700">User not found</div>
      </div>
    );
  }

  return (
    <HomeLayout user={currentUserData}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
          {/* Profile Picture */}
          <Avatar className="w-24 h-24 md:w-36 md:h-36 border-2 border-white shadow-md">
            <AvatarImage
              src={user.profile?.pfp || "/placeholder-user.jpg"}
              alt={user.username}
            />
            <AvatarFallback className="text-2xl">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-2xl font-semibold">{user.username}</h1>

              {isCurrentUser ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setShowEditForm(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={toggleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div className="text-center md:text-left">
                <span className="font-semibold">{stats.posts}</span> posts
              </div>
              <div className="text-center md:text-left">
                <span className="font-semibold">{stats.followers}</span>{" "}
                followers
              </div>
              <div className="text-center md:text-left">
                <span className="font-semibold">{stats.following}</span>{" "}
                following
              </div>
            </div>

            {/* Bio and Details */}
            <div className="space-y-1">
              {(user.firstName || user.lastName) && (
                <p className="font-semibold">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                </p>
              )}

              {user.profile?.bio && (
                <p className="text-sm whitespace-pre-line">
                  {user.profile.bio}
                </p>
              )}

              {user.profile?.website && (
                <p className="text-sm flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <a
                    href={
                      user.profile.website.startsWith("http")
                        ? user.profile.website
                        : `https://${user.profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}

              {user.location && (
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </p>
              )}

              {user.profile?.birthdate && (
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  Born{" "}
                  {format(new Date(user.profile.birthdate), "MMMM d, yyyy")}
                </p>
              )}

              <p className="text-xs text-gray-500">
                Joined{" "}
                {format(new Date(user.createdAt || Date.now()), "MMMM yyyy")}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <BlogFeed
              blogs={userBlogs}
              currentUser={currentUserData}
              hasMore={hasMore}
              onLoadMore={loadMoreBlogs}
            />

            {userBlogs.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Posts Yet
                </h3>
                <p className="text-gray-500">
                  {isCurrentUser
                    ? "Share your first post with your followers."
                    : `${user.username} hasn't posted anything yet.`}
                </p>

                {isCurrentUser && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/create")}
                  >
                    Create Post
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {isCurrentUser ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Saved Posts
                </h3>
                <p className="text-gray-500">Save posts to view them later.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Only {user.username} can see their saved posts.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal - Only render when showEditForm is true AND user data is available */}
      {showEditForm && user && (
        <ProfileEditForm
          user={user}
          onClose={() => setShowEditForm(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </HomeLayout>
  );
}
