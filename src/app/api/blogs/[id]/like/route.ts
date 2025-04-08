import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// POST to like a blog
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

    // Check if user already liked the blog
    const existingLike = await prisma.like.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    if (existingLike) {
      // If already liked, remove the like (toggle)
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({
        success: true,
        liked: false,
        message: "Blog unliked successfully",
      });
    }

    // Create a new like
    await prisma.like.create({
      data: {
        blogId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      liked: true,
      message: "Blog liked successfully",
    });
  } catch (error) {
    console.error("Error liking blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to like blog" },
      { status: 500 }
    );
  }
}

// GET to check if user liked a blog
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

    // Check if user liked the blog
    const like = await prisma.like.findFirst({
      where: {
        blogId,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check like status" },
      { status: 500 }
    );
  }
}
