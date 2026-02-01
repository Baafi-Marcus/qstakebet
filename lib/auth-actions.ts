"use server"

import { db } from "@/lib/db"
import { users, wallets, bonuses } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"

export async function registerUser(data: {
    email: string
    password: string
    name: string
    phone: string
    referredBy?: string
}) {
    try {
        // Check if user already exists (email or phone)
        const existingUser = await db.select().from(users)
            .where(or(eq(users.email, data.email), eq(users.phone, data.phone)))
            .limit(1)

        if (existingUser.length > 0) {
            return { success: false, error: "Email or Phone already registered" }
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
            phone: data.phone,
            referralCode,
            referredBy: data.referredBy || null,
            role: data.phone === process.env.ADMIN_PHONE ? "admin" : "user",
            status: "active"
        }).returning()

        if (!newUser || newUser.length === 0) {
            return { success: false, error: "Failed to create user" }
        }

        // Create wallet for user
        const walletId = `wlt-${Math.random().toString(36).substring(2, 11)}`
        await db.insert(wallets).values({
            id: walletId,
            userId: userId,
            balance: 0,
            bonusBalance: 5, // Start with Welcome Bonus
            currency: "GHS"
        })

        // Create welcome bonus record
        const bonusId = `bns-${Math.random().toString(36).substring(2, 11)}`
        await db.insert(bonuses).values({
            id: bonusId,
            userId: userId,
            type: "welcome",
            amount: 5.00,
            status: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })

        // Auto sign in
        await signIn("credentials", {
            phone: data.phone,
            password: data.password,
            redirect: false
        })

        return { success: true, user: newUser[0] }
    } catch (error) {
        console.error("Registration error:", error)
        return { success: false, error: "Registration failed" }
    }
}

export async function registerAdmin(data: {
    email: string
    password: string
    name: string
    phone: string
    adminToken: string
}) {
    // Verify the admin registration token
    if (!process.env.ADMIN_REGISTRATION_TOKEN || data.adminToken !== process.env.ADMIN_REGISTRATION_TOKEN) {
        return { success: false, error: "Invalid registration token" }
    }

    try {
        const existingUser = await db.select().from(users)
            .where(or(eq(users.email, data.email), eq(users.phone, data.phone)))
            .limit(1)

        if (existingUser.length > 0) {
            return { success: false, error: "Email or Phone already registered" }
        }

        const passwordHash = await bcrypt.hash(data.password, 10)
        const userId = `adm-${Math.random().toString(36).substr(2, 9)}`
        const referralCode = `ADM-${data.name.substring(0, 3).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

        const newUser = await db.insert(users).values({
            id: userId,
            email: data.email,
            passwordHash,
            name: data.name,
            phone: data.phone,
            referralCode,
            role: "admin",
            status: "active"
        }).returning()

        if (!newUser || newUser.length === 0) {
            return { success: false, error: "Failed to create admin" }
        }

        // Create wallet
        await db.insert(wallets).values({
            id: `wlt-${Math.random().toString(36).substring(2, 11)}`,
            userId: userId,
            balance: 0,
            bonusBalance: 0,
            currency: "GHS"
        })

        // Auto sign in
        await signIn("credentials", {
            phone: data.phone,
            password: data.password,
            redirect: false
        })

        return { success: true, user: newUser[0] }
    } catch (error) {
        console.error("Admin Registration error:", error)
        return { success: false, error: "Registration failed" }
    }
}

export async function getUserByEmail(email: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return user.length > 0 ? user[0] : null
}
