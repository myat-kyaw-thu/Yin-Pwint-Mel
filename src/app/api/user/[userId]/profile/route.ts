import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/user/[userId]/profile
 * Updates a user's profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const userData = await request.json();

    // Check if the user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        location: userData.location,
        about: userData.about,
        profile: {
          upsert: {
            create: {
              bio: userData.profile?.bio,
              website: userData.profile?.website,
              birthdate: userData.profile?.birthdate,
              pfp: userData.profile?.pfp,
            },
            update: {
              bio: userData.profile?.bio,
              website: userData.profile?.website,
              birthdate: userData.profile?.birthdate,
              pfp: userData.profile?.pfp,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Remove sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
