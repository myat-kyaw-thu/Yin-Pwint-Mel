import { prisma } from "@/lib/prisma"; // Assuming you have a Prisma client setup
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/username/[username]/following
 * Fetches the users that a specific user is following
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Get the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get the users that this user is following
    const followingRelations = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          include: {
            profile: {
              select: {
                id: true,
                bio: true,
                pfp: true,
                website: true,
                birthdate: true,
              },
            },
          },
        },
      },
    });

    // Extract the following users from the relations
    const following = followingRelations.map((relation) => relation.following);

    return NextResponse.json({
      success: true,
      following,
    });
  } catch (error) {
    console.error("Error fetching following users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch following users" },
      { status: 500 }
    );
  }
}
