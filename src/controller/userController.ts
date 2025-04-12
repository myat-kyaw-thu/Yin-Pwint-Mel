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

class UserController {
  /**
   * Fetch user data by email
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
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();

      // Handle both response formats: direct user object or {success, user/data}
      if (result.success) {
        // If response has success property, check for user or data property
        return result.user || result.data || null;
      } else if (result.id && result.email && result.username) {
        // If response is a direct user object
        return result;
      }

      // If we get here, the response format is unexpected
      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error fetching user data:", error);

      return null;
    }
  }

  /**
   * Fetch user data by username
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
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();

      // Handle both response formats
      if (result.success) {
        return result.data || result.user || null;
      } else if (result.id && result.email && result.username) {
        return result;
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`Error fetching user data for ${username}:`, error);

      return null;
    }
  }

  /**
   * Fetch suggested users
   */
  async getSuggestedUsers(limit = 5): Promise<SuggestedUser[]> {
    try {
      const response = await fetch(`/api/user/suggested?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suggested users");
      }

      const result = await response.json();

      // Handle both response formats
      if (result.success && result.users) {
        return result.users;
      } else if (Array.isArray(result)) {
        return result;
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error fetching suggested users:", error);

      return [];
    }
  }

  /**
   * Update user profile
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
        throw new Error("Failed to update profile");
      }

      const result = await response.json();

      // Handle both response formats
      if (result.success) {
        return result.data || result.user || null;
      } else if (result.id && result.email && result.username) {
        return result;
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error updating profile:", error);

      return null;
    }
  }

  /**
   * Follow or unfollow a user
   */
  async toggleFollow(userId: string): Promise<{ following: boolean }> {
    try {
      const response = await fetch(`/api/user/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to follow/unfollow user");
      }

      const result = await response.json();

      if (result.success !== undefined && result.following !== undefined) {
        return { following: result.following };
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error following/unfollowing user:", error);

      throw error;
    }
  }

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/user/${userId}/follow`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check follow status");
      }

      const result = await response.json();

      if (result.success !== undefined && result.following !== undefined) {
        return result.following;
      }

      console.error("Unexpected response format:", result);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  }
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
        throw new Error("Failed to fetch user blogs");
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
}

export const userController = new UserController();
