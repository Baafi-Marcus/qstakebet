"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, or, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { RegisterUserSchema, RegisterAdminSchema } from "@/lib/validators"

const WELCOME_SMS = "Welcome to QSTAKEfantasy! Your NSMQ Fantasy account is ready. Draft your school squad and climb the leaderboard!"

export async function registerUser(data: {
    email: string
    password: string
    name: string
    username?: string
    phone: string
    referredBy?: string
    almaMater?: string
}) {
    // Rate limit: 3 registrations per hour per IP
    const limiter = await rateLimit("register-user", 3, 3600000);
    if (!limiter.success) {
        return { success: false, error: limiter.error };
    }

    // Zod Validation
    const validation = RegisterUserSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

    const validatedData = validation.data;

    try {
        // Check if user already exists (email or phone)
        const existingUser = await db.select().from(users)
            .where(or(eq(users.email, data.email), eq(users.phone, data.phone)))
            .limit(1)

        if (existingUser.length > 0) {
            return { success: false, error: "Email or Phone already registered" }
        }

        // Check username availability (case-insensitive)
        if (data.username) {
            const taken = await db.select({ id: users.id }).from(users)
                .where(sql`lower(${users.username}) = ${data.username.toLowerCase()}`)
                .limit(1)
            if (taken.length > 0) {
                return { success: false, error: "That username is already taken" }
            }
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
            username: data.username || null,
            phone: data.phone,
            phoneVerified: new Date(),
            referralCode,
            referredBy: data.referredBy || null,
            almaMater: data.almaMater || null,
            role: data.phone === process.env.ADMIN_PHONE ? "admin" : "user",
            status: "active"
        }).returning()

        if (!newUser || newUser.length === 0) {
            return { success: false, error: "Failed to create user" }
        }

        // Auto sign in
        await signIn("credentials", {
            phone: data.phone,
            password: data.password,
            redirect: false
        })

        // Fire-and-forget welcome SMS (must never block or fail registration)
        try {
            const { vynfy } = await import("@/lib/vynfy-client")
            const { formatToInternational } = await import("@/lib/phone-utils")
            vynfy.sendSMS([formatToInternational(validatedData.phone)], WELCOME_SMS)
                .catch((e) => console.error("Welcome SMS failed:", e))
        } catch (e) {
            console.error("Welcome SMS init failed:", e)
        }

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
    // Rate limit: 2 admin registration attempts per hour per IP
    const limiter = await rateLimit("register-admin", 2, 3600000);
    if (!limiter.success) {
        return { success: false, error: limiter.error };
    }

    // Zod Validation
    const validation = RegisterAdminSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message };
    }

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

export async function resetPassword(data: {
    phone: string
    password: string
}) {
    // Rate limit password resets: 5 per hour per IP
    const limiter = await rateLimit("reset-password", 5, 3600000);
    if (!limiter.success) {
        return { success: false, error: limiter.error };
    }

    try {
        // 1. Check if user exists (SMS OTP verification temporarily disabled due to delivery issues)
        const user = await db.query.users.findFirst({
            where: eq(users.phone, data.phone)
        })

        if (!user) {
            return { success: false, error: "No account found with this phone number" }
        }

        // 2. Hash new password
        const passwordHash = await bcrypt.hash(data.password, 10)

        // 3. Update user
        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, user.id))

        // 4. Success
        return { success: true, message: "Password reset successfully. You can now log in." }

    } catch (error) {
        console.error("Password reset error:", error)
        return { success: false, error: "Failed to reset password. Please try again." }
    }
}
