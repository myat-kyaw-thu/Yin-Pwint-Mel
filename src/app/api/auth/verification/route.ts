import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"

// Validation schema for verification
const verificationSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
})

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()

        // Validate input
        const validationResult = verificationSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({ error: validationResult.error.errors }, { status: 400 })
        }

        const { email, code } = validationResult.data

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if user is already verified
        if (user.isVerified) {
            return NextResponse.json({ message: "User is already verified", username: user.username }, { status: 200 })
        }

        // Find verification token
        const verificationToken = await prisma.verificationToken.findFirst({
            where: {
                userId: user.id,
                token: code,
                expiresAt: {
                    gt: new Date(),
                },
            },
        })

        if (!verificationToken) {
            return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
        }

        // Mark user as verified
        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        })

        // Delete the used verification token
        await prisma.verificationToken.delete({
            where: { id: verificationToken.id },
        })

        return NextResponse.json(
            {
                message: "Email verified successfully",
                username: user.username,
            },
            { status: 200 },
        )
    } catch (error) {
        console.error("Verification error:", error)
        return NextResponse.json({ error: "An error occurred during verification" }, { status: 500 })
    }
}

