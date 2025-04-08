import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET comments for a blog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blogId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    // Calculate pagination
    const skip = (page - 1) * limit;

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

    // Get comments with pagination
    const comments = await prisma.comment.findMany({
      where: { blogId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                pfp: true,
              },
            },
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.comment.count({ where: { blogId } });

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment
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

    const body = await request.json();
    const { content } = body;

    // Validate content
    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Comment content is required" },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        blogId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                pfp: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: "Comment added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add comment" },
      { status: 500 }
    );
  }
}
