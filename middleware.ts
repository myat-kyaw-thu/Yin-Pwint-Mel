import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define public paths that don't require authentication
    const publicPaths = [
        "/auth/login",
        "/auth/signup",
        "/auth/email-verify",
        "/auth/verification",
        "/auth/forgot-password",
    ]

    // Check if the current path is a public path
    const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath) || path.startsWith("/api/auth"))

    // Get the authentication session
    const session = await auth()

    // If the path is /home/[username]/... and user is not authenticated, redirect to signup
    if (path.startsWith("/home/") && !session) {
        return NextResponse.redirect(new URL("/auth/signup", request.url))
    }

    // If user is already authenticated and trying to access auth pages, redirect to home
    if (isPublicPath && session?.user) {
        return NextResponse.redirect(new URL(`/home/${session.user.username}`, request.url))
    }

    return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
    matcher: ["/home/:path*", "/auth/:path*"],
}

