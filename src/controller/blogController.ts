export interface Blog {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    email: string;
    profile?: {
      pfp?: string | null;
      bio?: string | null;
    } | null;
  };
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

export interface BlogsResponse {
  data: Blog[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}
class BlogController {
  /**
   * Fetch blogs for the feed with cursor-based pagination for infinite scrolling
   */
  async getFeedBlogs(
    id: string,
    cursor?: string,
    limit = 15
  ): Promise<BlogsResponse> {
    try {
      const url = new URL("/api/blogs", window.location.origin);
      url.searchParams.append("limit", limit.toString());

      // Add cursor for pagination if provided
      if (cursor) {
        url.searchParams.append("cursor", cursor);
      }

      // Add feed=true to get feed blogs (from followed users and own blogs)
      url.searchParams.append("feed", "true");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }

      const result = await response.json();

      // Check if the user has liked or favorited each blog
      if (result.data && result.data.length > 0) {
        await Promise.all(
          result.data.map(async (blog: Blog) => {
            const [likeResponse, favoriteResponse] = await Promise.all([
              fetch(`/api/blogs/${blog.id}/like`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": id,
                },
              }),
              fetch(`/api/blogs/${blog.id}/favorite`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": id,
                },
              }),
            ]);

            if (likeResponse.ok) {
              const likeData = await likeResponse.json();
              blog.isLiked = likeData.liked;
            }

            if (favoriteResponse.ok) {
              const favoriteData = await favoriteResponse.json();
              blog.isFavorited = favoriteData.favorited;
            }
          })
        );
      }

      return result;
    } catch (error) {
      console.error("Error fetching blogs:", error);
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
   * Fetch a single blog by ID
   */
  async getBlogById(userId: string, blogId: string): Promise<Blog | null> {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blog");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      // Check if the user has liked or favorited the blog
      const [likeResponse, favoriteResponse] = await Promise.all([
        fetch(`/api/blogs/${blogId}/like`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
        }),
        fetch(`/api/blogs/${blogId}/favorite`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user-id": userId },
        }),
      ]);

      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        result.data.isLiked = likeData.liked;
      }

      if (favoriteResponse.ok) {
        const favoriteData = await favoriteResponse.json();
        result.data.isFavorited = favoriteData.favorited;
      }

      return result.data;
    } catch (error) {
      console.error(`Error fetching blog ${blogId}:`, error);
      return null;
    }
  }

  /**
   * Create a new blog
   */
  async createBlog(
    blogData: {
      title: string;
      subtitle?: string;
      description: string;
      content: string;
      visibility: string;
      images: string[]; // Array of image URLs
      tags?: string[];
      excerpt?: string;
      featuredImage?: string;
      readingTime?: number;
    },
    id: string,
    username: string
  ): Promise<Blog | null> {
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": id,
          "x-user-username": username,
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create blog");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (error) {
      console.error("Error creating blog:", error);
      return null;
    }
  }

  /**
   * Update an existing blog
   */
  async updateBlog(
    blogId: string,
    blogData: {
      title?: string;
      subtitle?: string;
      description?: string;
      content?: string;
      visibility?: string;
      images?: string[]; // Array of image URLs
      tags?: string[];
      excerpt?: string;
      featuredImage?: string;
      readingTime?: number;
    }
  ): Promise<Blog | null> {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update blog");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (error) {
      console.error(`Error updating blog ${blogId}:`, error);
      return null;
    }
  }

  /**
   * Delete a blog
   */
  async deleteBlog(blogId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete blog");
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error(`Error deleting blog ${blogId}:`, error);
      return false;
    }
  }

  /**
   * Like or unlike a blog
   */
  async toggleLike(
    userId: string,
    blogId: string
  ): Promise<{ liked: boolean }> {
    try {
      const response = await fetch(`/api/blogs/${blogId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }

      const result = await response.json();
      return { liked: result.liked };
    } catch (error) {
      console.error(`Error toggling like for blog ${blogId}:`, error);
      throw error;
    }
  }

  /**
   * Favorite or unfavorite a blog
   */
  async toggleFavorite(
    userId: string,
    blogId: string
  ): Promise<{ favorited: boolean }> {
    try {
      const response = await fetch(`/api/blogs/${blogId}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const result = await response.json();
      return { favorited: result.favorited };
    } catch (error) {
      console.error(`Error toggling favorite for blog ${blogId}:`, error);
      throw error;
    }
  }

  /**
   * Get all tags with blog counts
   */
  async getTags() {
    try {
      const response = await fetch("/api/blogs/tags", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      return [];
    }
  }

  /**
   * Add a comment to a blog
   */
  async addComment(blogId: string, content: string, userId?: string) {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add user ID to headers if provided
      if (userId) {
        headers["x-user-id"] = userId;
      }

      const response = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (error) {
      console.error(`Error adding comment to blog ${blogId}:`, error);
      throw error;
    }
  }

  /**
   * Get comments for a blog with pagination
   */
  async getComments(blogId: string, page = 1, userId?: string) {
    try {
      const headers: HeadersInit = {
        "Content-ent-Type": "application/json",
      };

      // Add user ID to headers if provided
      if (userId) {
        headers["x-user-id"] = userId;
      }

      const response = await fetch(
        `/api/blogs/${blogId}/comments?page=${page}&limit=10`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return {
        comments: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error(`Error fetching comments for blog ${blogId}:`, error);
      return {
        comments: [],
        pagination: {
          total: 0,
          page,
          limit: 10,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * Update a comment
   */
  async updateComment(blogId: string, commentId: string, content: string) {
    try {
      const response = await fetch(
        `/api/blogs/${blogId}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response format");
      }

      return result.data;
    } catch (error) {
      console.error(`Error updating comment ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(blogId: string, commentId: string, userId?: string) {
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add user ID to headers if provided
      if (userId) {
        headers["x-user-id"] = userId;
      }

      const response = await fetch(
        `/api/blogs/${blogId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error(`Error deleting comment ${commentId}:`, error);
      throw error;
    }
  }
}

export const blogController = new BlogController();
