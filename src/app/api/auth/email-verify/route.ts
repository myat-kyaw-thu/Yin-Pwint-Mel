import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import prisma from "@/lib/prisma"

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY)

// Validation schema for email verification request
const emailVerifySchema = z.object({
    email: z.string().email(),
})

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()

        // Validate input
        const validationResult = emailVerifySchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({ error: validationResult.error.errors }, { status: 400 })
        }

        const { email } = validationResult.data

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Check if user is already verified
        if (user.isVerified) {
            return NextResponse.json({ error: "User is already verified" }, { status: 400 })
        }

        // Delete any existing verification tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { userId: user.id },
        })

        // Generate new verification token (6-digit code)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

        // Store verification token
        await prisma.verificationToken.create({
            data: {
                token: verificationCode,
                expiresAt,
                userId: user.id,
            },
        })

        // Send verification email
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
            to: email,
            subject: "Verify your email address",
            html: `
        <h1>Email Verification</h1>
        <p>Please use the following code to verify your email address:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 24 hours.</p>
      `,
        })

        return NextResponse.json({ message: `Verification code sent to email this is code for temp ${verificationCode}` }, { status: 200 })
    } catch (error) {
        console.error("Email verification error:", error)
        return NextResponse.json({ error: "An error occurred during email verification" }, { status: 500 })
    }
}

