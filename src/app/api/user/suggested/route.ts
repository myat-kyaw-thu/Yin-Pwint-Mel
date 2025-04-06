import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get("limit") || "5");
    const userId = request.headers.get("x-user-id");

    const totalUsers = await prisma.user.count({
      where: {
        id: { not: userId || undefined },
      },
    });

    const randomSkip = Math.max(
      0,
      Math.floor(Math.random() * totalUsers) - limit
    );

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: { not: userId || undefined },
      },
      take: limit,
      skip: randomSkip,
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            blogs: true,
          },
        },
      },
    });

    // Check if the current user is following each suggested user
    const usersWithFollowStatus = await Promise.all(
      suggestedUsers.map(async (user) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;

        // Check if the current user is following this user
        let isFollowing = false;
        if (userId) {
          const followRecord = await prisma.follow.findFirst({
            where: {
              followerId: userId,
              followingId: user.id,
            },
          });
          isFollowing = !!followRecord;
        }

        return {
          ...userWithoutPassword,
          isFollowing,
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithFollowStatus,
    });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch suggested users" },
      { status: 500 }
    );
  }
}
