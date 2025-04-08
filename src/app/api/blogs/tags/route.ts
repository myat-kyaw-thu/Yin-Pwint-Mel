import prisma from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

// GET all tags
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");

    // Build where clause for filtering
    const where: { name?: { contains: string; mode: "insensitive" } } = {};

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
