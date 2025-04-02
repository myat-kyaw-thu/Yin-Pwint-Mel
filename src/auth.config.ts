import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authConfig: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize(credentials) {
                // Replace with your own logic to validate credentials
                if (credentials?.username === "admin" && credentials.password === "password") {
                    return { id: "1", username: "admin", email: "admin@example.com" }
                }
                return null
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },
    callbacks: {
        signIn({ user, account, profile, email, credentials }) {
            if (user) {
                return true
            }
            return false // Redirect to login page
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
                token.email = user.email
                token.username = user.username
            }
            return token
        },
        session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.username = token.username as string
            }
            return session
        },
    },
    session: {
        strategy: "jwt",
    },
}

