import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// PUT /api/user/[id]/profile - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const requestUserId = request.headers.get("x-user-id");

    // Check if the user is updating their own profile
    if (userId !== requestUserId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, location, about, profile } = body;

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        location,
        about,
      },
      include: {
        profile: true,
      },
    });

    // Update or create profile if profile data is provided
    if (profile) {
      const { bio, pfp, website, birthdate } = profile;

      // Check if user already has a profile
      const existingProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        // Update existing profile
        await prisma.profile.update({
          where: { userId },
          data: {
            bio,
            pfp,
            website,
            birthdate: birthdate ? new Date(birthdate) : undefined,
          },
        });
      } else {
        // Create new profile
        await prisma.profile.create({
          data: {
            userId,
            bio,
            pfp,
            website,
            birthdate: birthdate ? new Date(birthdate) : undefined,
          },
        });
      }
    }

    // Fetch the updated user with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error(`Error updating user profile:`, error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
