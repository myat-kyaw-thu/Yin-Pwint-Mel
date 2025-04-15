import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 10;

/**
 * GET /api/user/[userId]/saved
 * Returns blogs saved by a specific user with pagination
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
    const query = {
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc" as const,
      },
      take: limit + 1, // Take one more to check if there are more items
      include: {
        blog: {
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
        },
      },
    };

    // Add cursor if provided
    if (cursor) {
      query.where = {
        ...query.where,
        id: {
          gt: cursor, // Use greater than for pagination
        },
      };
    }

    // Fetch favorites
    const favorites = await prisma.favorite.findMany(query);

    // Check if there are more items
    const hasMore = favorites.length > limit;
    const data = hasMore ? favorites.slice(0, limit) : favorites;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    // Extract blogs from favorites and add isFavorited flag
    const blogs = data.map((favorite) => ({
      ...favorite.blog,
      isFavorited: true,
      isLiked: false, // Default value, will be updated below if needed
    }));

    // Get like status for each blog if user ID is provided in headers
    const requestUserId = request.headers.get("x-user-id");

    let blogsWithUserInteractions = blogs;

    if (requestUserId) {
      // Get all likes for the current user in one query
      const userLikes = await prisma.like.findMany({
        where: {
          userId: requestUserId,
          blogId: {
            in: blogs.map((blog) => blog.id),
          },
        },
        select: {
          blogId: true,
        },
      });

      // Create lookup map for faster access
      const likedBlogIds = new Set(userLikes.map((like) => like.blogId));

      // Add isLiked property to each blog
      blogsWithUserInteractions = blogs.map((blog) => ({
        ...blog,
        isLiked: likedBlogIds.has(blog.id),
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
    console.error(
      `Error fetching saved blogs for user ${params.userId}:`,
      error
    );
    return NextResponse.json(
      { success: false, message: "Failed to fetch saved blogs" },
      { status: 500 }
    );
  }
}
