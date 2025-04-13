export interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  createdAt?: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  about?: string;
  profile?: {
    id?: string;
    bio?: string | null;
    pfp?: string | null;
    website?: string | null;
    birthdate?: string | null;
  } | null;
}

export interface SuggestedUser extends User {
  _count: {
    followers: number;
    blogs: number;
  };
  isFollowing?: boolean;
}

/**
 * UserController handles all user-related API calls
 * Each method is documented with:
 * - Required parameters
 * - API endpoint
 * - Expected response format
 */
class UserController {
  /**
   * Fetch user data by email
   * @param email - User's email address
   * @returns User object or null if not found
   * @endpoint POST /api/user
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const result = await response.json();

      // Handle response format
      if (result.success) {
        return result.user || result.data || null;
      } else if (result.id && result.email && result.username) {
        return result;
      }

      console.error("Unexpected response format:", result);
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  /**
   * Fetch user data by username
   * @param username - User's username
   * @returns User object or null if not found
   * @endpoint GET /api/user/username/{username}
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/user/username/${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const result = await response.json();

      // Handle response format
      if (result.success) {
        return result.data || result.user || null;
      } else if (result.id && result.email && result.username) {
        return result;
      }

      console.error("Unexpected response format:", result);
      return null;
    } catch (error) {
      console.error(`Error fetching user data for ${username}:`, error);
      return null;
    }
  }

  /**
   * Fetch user statistics (posts, followers, following)
   * @param userId - ID of the user to get stats for
   * @returns Object containing post, follower, and following counts
   * @endpoint GET /api/user/{userId}/stats
   */
  async getUserStats(userId: string) {
    try {
      const response = await fetch(`/api/user/${userId}/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId, // The current user's ID is sent in the header
        },
      });

      if (!response.ok) {
        console.error(`Stats API error: ${response.status}`);
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        console.error("Stats API returned error:", result.message);
        return {
          posts: 0,
          followers: 0,
          following: 0,
        };
      }

      return {
        posts: result.posts || 0,
        followers: result.followers || 0,
        following: result.following || 0,
      };
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error);
      return {
        posts: 0,
        followers: 0,
        following: 0,
      };
    }
  }

  /**
   * Update user profile
   * @param userId - ID of the user to update
   * @param profileData - Object containing profile data to update
   * @returns Updated user object or null if update failed
   * @endpoint PUT /api/user/{userId}/profile
   */
  async updateProfile(
    userId: string,
    profileData: Partial<User>
  ): Promise<User | null> {
    try {
      const response = await fetch(`/api/user/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const result = await response.json();

      // Handle response format
      if (result.success) {
        return result.data || result.user || null;
      } else if (result.id && result.email && result.username) {
        return result;
      }

      console.error("Unexpected response format:", result);
      return null;
    } catch (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Follow or unfollow a user
   * @param targetUserId - ID of the user to follow/unfollow
   * @param currentUserId - ID of the current user (the follower)
   * @returns Object with following status
   * @endpoint POST /api/user/{targetUserId}/follow
   */
  async toggleFollow(
    targetUserId: string,
    currentUserId: string
  ): Promise<{ following: boolean }> {
    try {
      const response = await fetch(`/api/user/${targetUserId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId, // The current user's ID is sent in the header
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to follow/unfollow user: ${response.status}`);
      }

      const result = await response.json();

      if (result.success !== undefined && result.following !== undefined) {
        return { following: result.following };
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Error toggling follow for user ${targetUserId}:`, error);
      throw error;
    }
  }

  /**
   * Check if current user is following another user
   * @param targetUserId - ID of the user to check if being followed
   * @param currentUserId - ID of the current user (the potential follower)
   * @returns Boolean indicating if the current user is following the target user
   * @endpoint GET /api/user/{targetUserId}/follow
   */
  async isFollowing(
    targetUserId: string,
    currentUserId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/user/${targetUserId}/follow`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId, // The current user's ID is sent in the header
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check follow status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success !== undefined && result.following !== undefined) {
        return result.following;
      }

      console.error("Unexpected response format:", result);
      return false;
    } catch (error) {
      console.error(
        `Error checking if user ${currentUserId} is following ${targetUserId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get blogs created by a specific user
   * @param userId - ID of the user whose blogs to fetch
   * @param cursor - Optional cursor for pagination
   * @returns Object containing blog data and pagination info
   * @endpoint GET /api/user/{userId}/blogs
   */
  async getUserBlogs(userId: string, cursor?: string | null) {
    try {
      const queryParams = new URLSearchParams();

      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      const response = await fetch(
        `/api/user/${userId}/blogs?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user blogs: ${response.status}`);
      }

      const result = await response.json();

      // Handle response format
      if (result.success) {
        return {
          data: result.data || [],
          pagination: {
            hasMore: result.pagination?.hasMore || false,
            nextCursor: result.pagination?.nextCursor || null,
          },
        };
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Error fetching blogs for user ${userId}:`, error);
      return {
        data: [],
        pagination: {
          hasMore: false,
          nextCursor: null,
        },
      };
    }
  }

  /**
   * Get suggested users for the current user to follow
   * @param limit - Maximum number of users to return
   * @param currentUserId - ID of the current user
   * @returns Array of suggested users
   * @endpoint GET /api/suggested-users
   */
  async getSuggestedUsers(
    currentUserId?: string,
    limit = 5
  ): Promise<SuggestedUser[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", limit.toString());

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (currentUserId) {
        headers["x-user-id"] = currentUserId;
      }

      const response = await fetch(
        `/api/suggested-users?${queryParams.toString()}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch suggested users: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.users)) {
        return result.users;
      }

      console.error("Unexpected response format:", result);
      return [];
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      return [];
    }
  }
}

export const userController = new UserController();
