import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/[userId]/suggested
 * Returns an array of suggested users based on the provided limit
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Create a new URL object from the request URL to access searchParams
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);

    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(
      "Fetching suggested users for user:",
      userId,
      "with limit:",
      limit
    );

    // Example logic to get suggested users:
    // This sample query fetches other users (excluding the current user) and limits the result.
    // Adjust your query criteria as needed.
    const suggestedUsers = await prisma.user.findMany({
      where: {
        NOT: { id: userId },
      },
      take: limit,
      select: {
        id: true,
        username: true,
        email: true,
        profile: {
          select: {
            pfp: true,
          },
        },
        _count: {
          select: {
            followers: true,
            blogs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch suggested users",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
