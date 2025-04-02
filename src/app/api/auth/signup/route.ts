import { type NextRequest, NextResponse } from "next/server"
import bcrypt from 'bcryptjs';
import { z } from "zod"
import { Resend } from "resend"
import prisma from "@/lib/prisma"

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY)

// Validation schema for signup
const signupSchema = z
    .object({
        username: z.string().min(3).max(30),
        email: z.string().email(),
        password: z.string().min(8),
        confirmPassword: z.string().min(8),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()

        // Validate input
        const validationResult = signupSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json({ error: validationResult.error.errors }, { status: 400 })
        }

        const { username, email, password } = validationResult.data

        // Check if user already exists
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUserByEmail) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 })
        }

        const existingUserByUsername = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUserByUsername) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                profile: {
                    create: {}, // Create an empty profile
                },
            },
        })

        // Generate verification token (6-digit code)
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
        <p>Thank you for signing up! Please use the following code to verify your email address:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 24 hours.</p>
      `,
        })

        return NextResponse.json(
            {
                message: "User created successfully. Verification code sent to email.",
                userId: user.id,
                email: user.email,
            },
            { status: 201 },
        )
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json({ error: "An error occurred during signup" }, { status: 500 })
    }
}

