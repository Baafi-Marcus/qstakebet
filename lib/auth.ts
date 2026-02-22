import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                phone: { label: "Phone Number", type: "tel" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.password) {
                    return null
                }

                // Find user by phone (normalize input)
                const phone = (credentials.phone as string).replace(/\s+/g, "")
                const user = await db.select().from(users).where(eq(users.phone, phone)).limit(1)

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
                    phone: user[0].phone,
                    role: user[0].role
                }
            }
        })
    ],
})
