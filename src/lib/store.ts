import type { Blog } from "@/controller/blogController";
import type { SuggestedUser, User } from "@/controller/userController";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FollowingUser extends User {
  profile?: {
    id?: string;
    bio?: string | null;
    pfp?: string | null;
    website?: string | null;
    birthdate?: string | null;
  } | null;
}

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

interface AppState {
  // User data
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Cache for user profiles
  userProfiles: Record<string, User>;
  setUserProfile: (username: string, user: User) => void;
  getUserProfile: (username: string) => User | null;

  // Blog data
  feedBlogs: Record<
    string,
    {
      data: Blog[];
      pagination: { hasMore: boolean; nextCursor: string | null };
      timestamp: number;
    }
  >;
  setFeedBlogs: (
    userId: string,
    data: Blog[],
    pagination: { hasMore: boolean; nextCursor: string | null }
  ) => void;
  getFeedBlogs: (userId: string) => {
    data: Blog[];
    pagination: { hasMore: boolean; nextCursor: string | null };
    timestamp: number;
  } | null;

  // Blog detail data
  blogDetails: Record<string, { data: Blog; timestamp: number }>;
  setBlogDetail: (blogId: string, data: Blog) => void;
  getBlogDetail: (blogId: string) => { data: Blog; timestamp: number } | null;

  // Blog comments
  blogComments: Record<
    string,
    {
      comments: Comment[];
      pagination: { page: number; totalPages: number };
      timestamp: number;
    }
  >;
  setBlogComments: (
    blogId: string,
    comments: Comment[],
    pagination: { page: number; totalPages: number }
  ) => void;
  getBlogComments: (blogId: string) => {
    comments: Comment[];
    pagination: { page: number; totalPages: number };
    timestamp: number;
  } | null;

  // User blogs
  userBlogs: Record<
    string,
    {
      data: Blog[];
      pagination: { hasMore: boolean; nextCursor: string | null };
      timestamp: number;
    }
  >;
  setUserBlogs: (
    userId: string,
    data: Blog[],
    pagination: { hasMore: boolean; nextCursor: string | null }
  ) => void;
  getUserBlogs: (userId: string) => {
    data: Blog[];
    pagination: { hasMore: boolean; nextCursor: string | null };
    timestamp: number;
  } | null;

  // Following users
  followingUsers: Record<string, { data: FollowingUser[]; timestamp: number }>;
  setFollowingUsers: (userId: string, data: FollowingUser[]) => void;
  getFollowingUsers: (
    userId: string
  ) => { data: FollowingUser[]; timestamp: number } | null;

  // Suggested users
  suggestedUsers: { data: SuggestedUser[]; timestamp: number } | null;
  setSuggestedUsers: (data: SuggestedUser[]) => void;

  // User stats
  userStats: Record<
    string,
    { posts: number; followers: number; following: number; timestamp: number }
  >;
  setUserStats: (
    userId: string,
    stats: { posts: number; followers: number; following: number }
  ) => void;
  getUserStats: (userId: string) => {
    posts: number;
    followers: number;
    following: number;
    timestamp: number;
  } | null;

  // Follow status
  followStatus: Record<string, { following: boolean; timestamp: number }>;
  setFollowStatus: (userId: string, following: boolean) => void;
  getFollowStatus: (
    userId: string
  ) => { following: boolean; timestamp: number } | null;

  // Cache invalidation
  invalidateUserData: (userId: string) => void;
  invalidateFeedBlogs: (userId: string) => void;
  invalidateUserBlogs: (userId: string) => void;
  invalidateFollowingUsers: (userId: string) => void;
  invalidateSuggestedUsers: () => void;
  invalidateUserStats: (userId: string) => void;
  invalidateFollowStatus: (userId: string) => void;
  invalidateBlogDetail: (blogId: string) => void;
  invalidateBlogComments: (blogId: string) => void;
  clearCache: () => void;

  // Add these to your existing store interface
  savedBlogs: Record<
    string,
    {
      data: Blog[];
      pagination: { hasMore: boolean; nextCursor: string | null };
      timestamp: number;
    }
  >;
  setSavedBlogs: (
    userId: string,
    data: Blog[],
    pagination: { hasMore: boolean; nextCursor: string | null }
  ) => void;
  getSavedBlogs: (userId: string) => {
    data: Blog[];
    pagination: { hasMore: boolean; nextCursor: string | null };
    timestamp: number;
  } | null;
  invalidateSavedBlogs: (userId: string) => void;
}

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User data
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      // User profiles
      userProfiles: {},
      setUserProfile: (username, user) =>
        set((state) => ({
          userProfiles: {
            ...state.userProfiles,
            [username]: user,
          },
        })),
      getUserProfile: (username) => get().userProfiles[username] || null,

      // Feed blogs
      feedBlogs: {},
      setFeedBlogs: (userId, data, pagination) =>
        set((state) => ({
          feedBlogs: {
            ...state.feedBlogs,
            [userId]: {
              data,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getFeedBlogs: (userId) => {
        const cached = get().feedBlogs[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Blog detail
      blogDetails: {},
      setBlogDetail: (blogId, data) =>
        set((state) => ({
          blogDetails: {
            ...state.blogDetails,
            [blogId]: {
              data,
              timestamp: Date.now(),
            },
          },
        })),
      getBlogDetail: (blogId) => {
        const cached = get().blogDetails[blogId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Blog comments
      blogComments: {},
      setBlogComments: (blogId, comments, pagination) =>
        set((state) => ({
          blogComments: {
            ...state.blogComments,
            [blogId]: {
              comments,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getBlogComments: (blogId) => {
        const cached = get().blogComments[blogId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // User blogs
      userBlogs: {},
      setUserBlogs: (userId, data, pagination) =>
        set((state) => ({
          userBlogs: {
            ...state.userBlogs,
            [userId]: {
              data,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getUserBlogs: (userId) => {
        const cached = get().userBlogs[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Following users
      followingUsers: {},
      setFollowingUsers: (userId, data) =>
        set((state) => ({
          followingUsers: {
            ...state.followingUsers,
            [userId]: {
              data,
              timestamp: Date.now(),
            },
          },
        })),
      getFollowingUsers: (userId) => {
        const cached = get().followingUsers[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Suggested users
      suggestedUsers: null,
      setSuggestedUsers: (data) =>
        set({
          suggestedUsers: {
            data,
            timestamp: Date.now(),
          },
        }),

      // User stats
      userStats: {},
      setUserStats: (userId, stats) =>
        set((state) => ({
          userStats: {
            ...state.userStats,
            [userId]: {
              ...stats,
              timestamp: Date.now(),
            },
          },
        })),
      getUserStats: (userId) => {
        const cached = get().userStats[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Follow status
      followStatus: {},
      setFollowStatus: (userId, following) =>
        set((state) => ({
          followStatus: {
            ...state.followStatus,
            [userId]: {
              following,
              timestamp: Date.now(),
            },
          },
        })),
      getFollowStatus: (userId) => {
        const cached = get().followStatus[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },

      // Cache invalidation
      invalidateUserData: (userId) =>
        set((state) => {
          const { userProfiles, ...rest } = state;
          const newUserProfiles = { ...userProfiles };

          // Find and remove the user profile by userId
          Object.keys(newUserProfiles).forEach((username) => {
            if (newUserProfiles[username]?.id === userId) {
              delete newUserProfiles[username];
            }
          });

          return {
            ...rest,
            userProfiles: newUserProfiles,
          };
        }),
      invalidateFeedBlogs: (userId) =>
        set((state) => {
          const { feedBlogs, ...rest } = state;
          const newFeedBlogs = { ...feedBlogs };
          delete newFeedBlogs[userId];
          return {
            ...rest,
            feedBlogs: newFeedBlogs,
          };
        }),
      invalidateUserBlogs: (userId) =>
        set((state) => {
          const { userBlogs, ...rest } = state;
          const newUserBlogs = { ...userBlogs };
          delete newUserBlogs[userId];
          return {
            ...rest,
            userBlogs: newUserBlogs,
          };
        }),
      invalidateFollowingUsers: (userId) =>
        set((state) => {
          const { followingUsers, ...rest } = state;
          const newFollowingUsers = { ...followingUsers };
          delete newFollowingUsers[userId];
          return {
            ...rest,
            followingUsers: newFollowingUsers,
          };
        }),
      invalidateSuggestedUsers: () =>
        set((state) => ({
          ...state,
          suggestedUsers: null,
        })),
      invalidateUserStats: (userId) =>
        set((state) => {
          const { userStats, ...rest } = state;
          const newUserStats = { ...userStats };
          delete newUserStats[userId];
          return {
            ...rest,
            userStats: newUserStats,
          };
        }),
      invalidateFollowStatus: (userId) =>
        set((state) => {
          const { followStatus, ...rest } = state;
          const newFollowStatus = { ...followStatus };
          delete newFollowStatus[userId];
          return {
            ...rest,
            followStatus: newFollowStatus,
          };
        }),
      invalidateBlogDetail: (blogId) =>
        set((state) => {
          const { blogDetails, ...rest } = state;
          const newBlogDetails = { ...blogDetails };
          delete newBlogDetails[blogId];
          return {
            ...rest,
            blogDetails: newBlogDetails,
          };
        }),
      invalidateBlogComments: (blogId) =>
        set((state) => {
          const { blogComments, ...rest } = state;
          const newBlogComments = { ...blogComments };
          delete newBlogComments[blogId];
          return {
            ...rest,
            blogComments: newBlogComments,
          };
        }),
      clearCache: () =>
        set({
          userProfiles: {},
          feedBlogs: {},
          userBlogs: {},
          followingUsers: {},
          suggestedUsers: null,
          userStats: {},
          followStatus: {},
          blogDetails: {},
          blogComments: {},
        }),

      // Add these implementations to your store
      // Saved blogs
      savedBlogs: {},
      setSavedBlogs: (userId, data, pagination) =>
        set((state) => ({
          savedBlogs: {
            ...state.savedBlogs,
            [userId]: {
              data,
              pagination,
              timestamp: Date.now(),
            },
          },
        })),
      getSavedBlogs: (userId) => {
        const cached = get().savedBlogs[userId];
        if (!cached || Date.now() - cached.timestamp > CACHE_EXPIRATION) {
          return null;
        }
        return cached;
      },
      invalidateSavedBlogs: (userId) =>
        set((state) => {
          const { savedBlogs, ...rest } = state;
          const newSavedBlogs = { ...savedBlogs };
          delete newSavedBlogs[userId];
          return {
            ...rest,
            savedBlogs: newSavedBlogs,
          };
        }),
    }),
    {
      name: "blog-app-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        userProfiles: state.userProfiles,
        feedBlogs: state.feedBlogs,
        userBlogs: state.userBlogs,
        followingUsers: state.followingUsers,
        suggestedUsers: state.suggestedUsers,
        userStats: state.userStats,
        followStatus: state.followStatus,
        blogDetails: state.blogDetails,
        blogComments: state.blogComments,
        savedBlogs: state.savedBlogs,
      }),
    }
  )
);

export default useStore;
