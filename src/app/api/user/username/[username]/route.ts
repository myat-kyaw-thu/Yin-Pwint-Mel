import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/users/username/[username] - Get user by username
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error(`Error fetching user by username ${params.username}:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
