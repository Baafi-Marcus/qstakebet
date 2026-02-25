"use server"

import { db } from "@/lib/db"
import { users, wallets, bonuses, transactions, referrals } from "@/lib/db/schema"
import { eq, or } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { verifyOTP } from "@/lib/verification-actions"
import { vynfy } from "@/lib/vynfy-client"
import { rateLimit } from "@/lib/rate-limit"
import { RegisterUserSchema, RegisterAdminSchema } from "@/lib/validators"

export async function registerUser(data: {
    email: string
    password: string
    name: string
    phone: string
    referredBy?: string
    otp?: string
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
        // Verify OTP first
        const verification = await verifyOTP(validatedData.phone, validatedData.otp)
        if (!verification.success) {
            return { success: false, error: verification.error || "Invalid OTP" }
        }

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
            phoneVerified: new Date(),
            referralCode,
            referredBy: data.referredBy || null,
            role: data.phone === process.env.ADMIN_PHONE ? "admin" : "user",
            status: "active"
        }).returning()

        if (!newUser || newUser.length === 0) {
            return { success: false, error: "Failed to create user" }
        }

        // --- REFERRAL TRACKING ---
        if (data.referredBy) {
            try {
                const referrer = await db.query.users.findFirst({
                    where: eq(users.referralCode, data.referredBy)
                });

                if (referrer) {
                    await db.insert(referrals).values({
                        id: `ref-${Math.random().toString(36).substring(2, 11)}`,
                        referrerId: referrer.id,
                        referredUserId: userId,
                        referralCode: data.referredBy,
                        status: "pending",
                        referrerBonus: 10.00 // Set the potential reward amount
                    });
                }
            } catch (refError) {
                console.error("Failed to record referral:", refError);
            }
        }
        // --- END REFERRAL TRACKING ---

        // Create wallet for user
        const walletId = `wlt-${Math.random().toString(36).substring(2, 11)}`
        await db.insert(wallets).values({
            id: walletId,
            userId: userId,
            balance: 0,
            bonusBalance: 10, // Start with Welcome Bonus
            currency: "GHS"
        })

        // Create welcome bonus record
        const bonusId = `bns-${Math.random().toString(36).substring(2, 11)}`
        await db.insert(bonuses).values({
            id: bonusId,
            userId: userId,
            type: "welcome",
            amount: 10.00,
            status: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })

        // Send welcome SMS
        try {
            const { formatToInternational } = await import("@/lib/phone-utils")
            const formattedPhone = formatToInternational(data.phone)
            const welcomeMessage = `Welcome to QSTAKEbet! Your account has been created successfully. You've received 10 cedis free bet to start betting. Try out our instant virtual games: qstakebet.vercel.app/virtuals - Good luck!`;
            await vynfy.sendSMS([formattedPhone], welcomeMessage);
        } catch (smsError) {
            console.error("Failed to send welcome SMS:", smsError);
            // Don't fail registration if SMS fails
        }

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

export async function resetPassword(data: {
    phone: string
    otp: string
    password: string
}) {
    // Rate limit password resets: 5 per hour per IP
    const limiter = await rateLimit("reset-password", 5, 3600000);
    if (!limiter.success) {
        return { success: false, error: limiter.error };
    }

    try {
        // 1. Verify OTP
        const verification = await verifyOTP(data.phone, data.otp)
        if (!verification.success) {
            return { success: false, error: verification.error || "Invalid or expired OTP" }
        }

        // 2. Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.phone, data.phone)
        })

        if (!user) {
            return { success: false, error: "No account found with this phone number" }
        }

        // 3. Hash new password
        const passwordHash = await bcrypt.hash(data.password, 10)

        // 4. Update user
        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, user.id))

        // 5. Success
        return { success: true, message: "Password reset successfully. You can now log in." }

    } catch (error) {
        console.error("Password reset error:", error)
        return { success: false, error: "Failed to reset password. Please try again." }
    }
}
