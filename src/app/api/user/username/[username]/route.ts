import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/username/[username]
 * Returns user data by username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Remove sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
