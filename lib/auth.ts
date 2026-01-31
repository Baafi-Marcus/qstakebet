import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                // Find user by email
                const user = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1)

                if (!user || user.length === 0) {
                    return null
                }

                // Verify password
                const isValid = await bcrypt.compare(credentials.password as string, user[0].passwordHash)

                if (!isValid) {
                    return null
                }

                // Check if user is active
                if (user[0].status !== "active") {
                    return null
                }

                // Return user object
                return {
                    id: user[0].id,
                    email: user[0].email,
                    name: user[0].name,
                    role: user[0].role
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
})
