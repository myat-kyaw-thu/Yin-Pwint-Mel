import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        firstName: true,
        lastName: true,
        location: true,
        about: true,
        createdAt: true,
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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return in the original format for backward compatibility
    return NextResponse.json(user);
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user data" },
      { status: 500 }
    );
  }
}
