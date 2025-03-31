import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

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

    // Get the authentication token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    // If the path is /home/[username]/... and user is not authenticated, redirect to signup
    if (path.startsWith("/home/") && !token) {
        return NextResponse.redirect(new URL("/auth/signup", request.url))
    }

    // If user is already authenticated and trying to access auth pages, redirect to home
    if (isPublicPath && token) {
        return NextResponse.redirect(new URL(`/home/${token.username}`, request.url))
    }

    return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
    matcher: ["/home/:path*", "/auth/:path*"],
}
