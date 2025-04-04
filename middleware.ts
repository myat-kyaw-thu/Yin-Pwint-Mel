import { auth } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/auth/email-verify",
    "/auth/verification",
    "/auth/forgot-password",
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(
    (publicPath) => path.startsWith(publicPath) || path.startsWith("/api/auth")
  );

  // Check if the path is a blog API route
  const isBlogApiRoute = path.startsWith("/api/blogs");

  // Get the authentication session
  const session = await auth();

  // If the path is /home/[username]/... and user is not authenticated, redirect to signup
  if (path.startsWith("/home/") && !session) {
    return NextResponse.redirect(new URL("/auth/signup", request.url));
  }

  // If user is already authenticated and trying to access auth pages, redirect to home
  if (isPublicPath && session?.user) {
    return NextResponse.redirect(
      new URL(`/home/${session.user.username}`, request.url)
    );
  }

  // Handle blog API routes - require authentication and pass user info in headers
  if (isBlogApiRoute) {
    // If not authenticated, return 401 Unauthorized
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Authentication required" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Add the user info to the request headers for use in the API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set("x-user-username", session.user.username);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/home/:path*", "/auth/:path*", "/api/blogs/:path*"],
};
