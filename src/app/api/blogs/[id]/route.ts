import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET a single blog by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                pfp: true,
                bio: true,
              },
            },
          },
        },
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            favorites: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

// PUT update a blog
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if blog exists and belongs to the user
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author of the blog
    if (existingBlog.authorId !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only update your own blogs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      content,
      visibility,
      images,
      tags,
      excerpt,
      featuredImage,
      readingTime,
    } = body;

    // Validate required fields
    if (!title || !description || !content) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, description, and content are required",
        },
        { status: 400 }
      );
    }

    // Update blog with transaction to handle related data
    await prisma.$transaction(async (tx) => {
      // Update the blog
      await tx.blog.update({
        where: { id },
        data: {
          title,
          subtitle,
          description,
          content,
          visibility,
          excerpt,
          featuredImage,
          readingTime,
        },
      });

      // Handle images: delete existing and add new ones
      if (images) {
        // Delete existing images
        await tx.blogImage.deleteMany({
          where: { blogId: id },
        });

        // Add new images (limit to 5)
        const limitedImages = images.slice(0, 5);
        if (limitedImages.length > 0) {
          await tx.blogImage.createMany({
            data: limitedImages.map((url: string) => ({
              url,
              blogId: id,
            })),
          });
        }
      }

      // Handle tags: delete existing and add new ones
      if (tags) {
        // Delete existing blog-tag relations
        await tx.blogTag.deleteMany({
          where: { blogId: id },
        });

        // Add new tags
        for (const tagName of tags) {
          // Find or create tag
          let tag = await tx.tag.findUnique({
            where: { name: tagName },
          });

          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName },
            });
          }

          // Create blog-tag relation
          await tx.blogTag.create({
            data: {
              blogId: id,
              tagId: tag.id,
            },
          });
        }
      }
    });

    // Fetch the updated blog with all relations
    const updatedBlog = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                pfp: true,
                bio: true,
              },
            },
          },
        },
        images: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBlog,
      message: "Blog updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// DELETE a blog
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if blog exists and belongs to the user
    const existingBlog = await prisma.blog.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingBlog) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author of the blog
    if (existingBlog.authorId !== userId) {
      return NextResponse.json(
        { success: false, message: "You can only delete your own blogs" },
        { status: 403 }
      );
    }

    // Delete blog with transaction to handle related data
    await prisma.$transaction(async (tx) => {
      // Delete related data first
      await tx.blogImage.deleteMany({ where: { blogId: id } });
      await tx.blogTag.deleteMany({ where: { blogId: id } });
      await tx.comment.deleteMany({ where: { blogId: id } });
      await tx.like.deleteMany({ where: { blogId: id } });
      await tx.favorite.deleteMany({ where: { blogId: id } });

      // Delete the blog
      await tx.blog.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
