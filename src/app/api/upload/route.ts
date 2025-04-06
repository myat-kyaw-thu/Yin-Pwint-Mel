import { mkdir, writeFile } from "fs/promises";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Get the user ID from the request headers
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${nanoid()}.${fileExtension}`;

    // Create directory structure for the user's blog images
    // In a real implementation, you would use the actual blog ID
    const tempBlogId = nanoid();
    const username = request.headers.get("x-user-username") || userId;
    const dirPath = join(
      process.cwd(),
      "public",
      "uploads",
      username,
      tempBlogId,
      "images"
    );

    // Create the directory if it doesn't exist
    await mkdir(dirPath, { recursive: true });

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to the server
    const filePath = join(dirPath, fileName);
    await writeFile(filePath, buffer);

    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${username}/${tempBlogId}/images/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
