import prisma from "@/lib/prisma";
import type { BlogVisibility } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

// GET all blogs with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const visibility = searchParams.get("visibility") as BlogVisibility | null;
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const authorId = searchParams.get("authorId");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: {
      visibility: BlogVisibility;
      OR?: {
        title?: { contains: string; mode: "insensitive" };
        subtitle?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }[];
      authorId?: string;
      tags?: { some: { tag: { name: string } } };
    } = {
      visibility: visibility || "PUBLIC",
    };

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { subtitle: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by author
    if (authorId) {
      where.authorId = authorId;
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // Get blogs with pagination, filtering, and sorting
    const blogs = await prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
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
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.blog.count({ where });

    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST create a new blog
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
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

    // Create blog with transaction to handle related data
    const blog = await prisma.$transaction(async (tx) => {
      // Create the blog
      const newBlog = await tx.blog.create({
        data: {
          title,
          subtitle,
          description,
          content,
          visibility: visibility || "PUBLIC",
          excerpt,
          featuredImage,
          readingTime,
          authorId: userId,
        },
      });

      // Add images if provided
      if (images && images.length > 0) {
        // Limit to 5 images
        const limitedImages = images.slice(0, 5);
        await tx.blogImage.createMany({
          data: limitedImages.map((url: string) => ({
            url,
            blogId: newBlog.id,
          })),
        });
      }

      // Add tags if provided
      if (tags && tags.length > 0) {
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
              blogId: newBlog.id,
              tagId: tag.id,
            },
          });
        }
      }

      return newBlog;
    });

    // Fetch the created blog with all relations
    const createdBlog = await prisma.blog.findUnique({
      where: { id: blog.id },
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

    return NextResponse.json(
      {
        success: true,
        data: createdBlog,
        message: "Blog created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create blog" },
      { status: 500 }
    );
  }
}
