import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/user/[id]/follow - Follow or unfollow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const followingId = params.id;
    const followerId = request.headers.get("x-user-id"); // The current user

    if (!followerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if users exist
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId } }),
      prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower || !following) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });

      return NextResponse.json({
        success: true,
        following: false,
        message: "User unfollowed successfully",
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      return NextResponse.json({
        success: true,
        following: true,
        message: "User followed successfully",
      });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to follow/unfollow user" },
      { status: 500 }
    );
  }
}

// GET /api/user/[id]/follow - Check if current user is following a user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const followingId = params.id;
    const followerId = request.headers.get("x-user-id");

    if (!followerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if following
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({
      success: true,
      following: !!follow,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
