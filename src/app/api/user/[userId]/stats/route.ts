import { prisma } from "@/lib/prisma"; // Import from the shared client
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/[userId]/stats
 * Returns user stats (posts, followers, following)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId; // Now using params.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching stats for user:", userId);

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

    // Get post count
    const postCount = await prisma.blog.count({
      where: { authorId: userId },
    });

    // Get follower count
    const followerCount = await prisma.follow.count({
      where: { followingId: userId },
    });

    // Get following count
    const followingCount = await prisma.follow.count({
      where: { followerId: userId },
    });

    return NextResponse.json({
      success: true,
      posts: postCount,
      followers: followerCount,
      following: followingCount,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user stats",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
