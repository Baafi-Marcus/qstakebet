"use server"

import { db } from "@/lib/db"
import { users, wallets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"

export async function registerUser(data: {
    email: string
    password: string
    name: string
    phone?: string
    referredBy?: string
}) {
    try {
        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1)

        if (existingUser.length > 0) {
            return { success: false, error: "Email already registered" }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10)

        // Generate unique user ID and referral code
        const userId = `usr-${Math.random().toString(36).substr(2, 9)}`
        const referralCode = `${data.name.substring(0, 3).toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`

        // Create user
        const newUser = await db.insert(users).values({
            id: userId,
            email: data.email,
            passwordHash,
            name: data.name,
            phone: data.phone || null,
            referralCode,
            referredBy: data.referredBy || null,
            role: "user",
            status: "active"
        }).returning()

        if (!newUser || newUser.length === 0) {
            return { success: false, error: "Failed to create user" }
        }

        // Create wallet for user
        const walletId = `wlt-${Math.random().toString(36).substr(2, 9)}`
        await db.insert(wallets).values({
            id: walletId,
            userId: userId,
            balance: 0,
            bonusBalance: 0,
            currency: "GHS"
        })

        // Auto sign in
        await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false
        })

        return { success: true, user: newUser[0] }
    } catch (error) {
        console.error("Registration error:", error)
        return { success: false, error: "Registration failed" }
    }
}

export async function getUserByEmail(email: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user.length > 0 ? user[0] : null
}
