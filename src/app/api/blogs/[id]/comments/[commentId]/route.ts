import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// PUT update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { commentId } = params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user is the author of the comment
    if (comment.authorId !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own comments" },
        { status: 403 }
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

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
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

    return NextResponse.json({
      success: true,
      data: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id: blogId, commentId } = params;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user is the author of the comment or the blog
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { authorId: true },
    });

    if (comment.authorId !== userId && blog?.authorId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only delete your own comments or comments on your blog",
        },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
