import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// POST to favorite a blog
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }

    // Check if user already favorited the blog
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    if (existingFavorite) {
      // If already favorited, remove the favorite (toggle)
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });

      return NextResponse.json({
        success: true,
        favorited: false,
        message: "Blog removed from favorites",
      });
    }

    // Create a new favorite
    await prisma.favorite.create({
      data: {
        blogId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      favorited: true,
      message: "Blog added to favorites",
    });
  } catch (error) {
    console.error("Error favoriting blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to favorite blog" },
      { status: 500 }
    );
  }
}

// GET to check if user favorited a blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user favorited the blog
    const favorite = await prisma.favorite.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      favorited: !!favorite,
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check favorite status" },
      { status: 500 }
    );
  }
}
