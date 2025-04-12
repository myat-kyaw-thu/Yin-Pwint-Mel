import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 10;

/**
 * GET /api/user/[userId]/blogs
 * Returns blogs created by a specific user with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Number(searchParams.get("limit") || ITEMS_PER_PAGE);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Build the query
    const query: Prisma.BlogFindManyArgs = {
      where: {
        authorId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1, // Take one more to check if there are more items
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                pfp: true,
                bio: true,
              },
            },
          },
        },
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    };

    // Add cursor if provided
    if (cursor) {
      query.cursor = {
        id: cursor,
      };
      query.skip = 1; // Skip the cursor
    }

    // Fetch blogs
    const blogs = await prisma.blog.findMany(query);

    // Check if there are more items
    const hasMore = blogs.length > limit;
    const data = hasMore ? blogs.slice(0, limit) : blogs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    // Get like and favorite status for each blog if user ID is provided in headers
    const requestUserId = request.headers.get("x-user-id");

    let blogsWithUserInteractions = data;

    if (requestUserId) {
      // Get all likes and favorites for the current user in one query each
      const userLikes = await prisma.like.findMany({
        where: {
          userId: requestUserId,
          blogId: {
            in: data.map((blog) => blog.id),
          },
        },
        select: {
          blogId: true,
        },
      });

      const userFavorites = await prisma.favorite.findMany({
        where: {
          userId: requestUserId,
          blogId: {
            in: data.map((blog) => blog.id),
          },
        },
        select: {
          blogId: true,
        },
      });

      // Create lookup maps for faster access
      const likedBlogIds = new Set(userLikes.map((like) => like.blogId));
      const favoritedBlogIds = new Set(userFavorites.map((fav) => fav.blogId));

      // Add isLiked and isFavorited properties to each blog
      blogsWithUserInteractions = data.map((blog) => ({
        ...blog,
        isLiked: likedBlogIds.has(blog.id),
        isFavorited: favoritedBlogIds.has(blog.id),
      }));
    }

    return NextResponse.json({
      success: true,
      data: blogsWithUserInteractions,
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error(`Error fetching blogs for user ${params.userId}:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user blogs" },
      { status: 500 }
    );
  }
}
