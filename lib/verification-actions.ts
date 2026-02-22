"use server"

import { db } from "@/lib/db"
import { verificationCodes, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { vynfy } from "@/lib/vynfy-client"
import { randomBytes } from "crypto"
import { auth } from "@/lib/auth"

/**
 * Generates a 6-digit OTP, stores it in DB, and sends it via SMS.
 */
export async function generateAndSendOTP(phone: string, isExistingUser = false) {
    if (!phone || phone.length < 10) {
        return { success: false, error: "Invalid phone number" }
    }

    try {
        // 1. Check if user exists (for forgot password/login flows)
        const user = await db.query.users.findFirst({
            where: eq(users.phone, phone)
        })

        if (isExistingUser && !user) {
            return { success: false, error: "Phone number not registered" }
        }

        if (!isExistingUser && user) {
            return { success: false, error: "Phone number is already associated with an account" }
        }

        // 2. Check for existing non-expired OTP (Rate Limiting / Cooldown)
        const existingOTP = await db.query.verificationCodes.findFirst({
            where: and(
                eq(verificationCodes.phone, phone),
                gt(verificationCodes.expiresAt, new Date())
            )
        })

        if (existingOTP) {
            const remainingMs = existingOTP.expiresAt.getTime() - Date.now()
            const remainingMins = Math.ceil(remainingMs / 60000)
            return {
                success: false,
                error: `Please wait ${remainingMins} minute${remainingMins > 1 ? "s" : ""} before requesting a new code.`
            }
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const id = `vc-${Date.now()}-${randomBytes(4).toString("hex")}`
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

        // Clear any old (expired) codes for this phone
        await db.delete(verificationCodes).where(eq(verificationCodes.phone, phone))

        await db.insert(verificationCodes).values({
            id,
            phone,
            code: otp,
            expiresAt
        })

        // Send SMS via Vynfy
        const { formatToInternational } = await import("@/lib/phone-utils")
        const formattedPhone = formatToInternational(phone)
        const message = `Your QSTAKEbet verification code is: ${otp}. Valid for 10 minutes.`
        const smsResult = await vynfy.sendSMS([formattedPhone], message)

        if (!smsResult.success) {
            console.error("Failed to send OTP SMS:", smsResult.error)
            return { success: false, error: "Failed to send SMS. Please try again." }
        }

        return { success: true, message: "OTP sent successfully" }

    } catch (error) {
        console.error("OTP Flow Error:", error)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Verifies the OTP provided by the user.
 * If valid, it can optionally mark a user as verified if userId is provided, 
 * or just return success for the frontend to proceed.
 */
export async function verifyOTP(phone: string, code: string) {
    try {
        const record = await db.query.verificationCodes.findFirst({
            where: and(
                eq(verificationCodes.phone, phone),
                eq(verificationCodes.code, code),
                gt(verificationCodes.expiresAt, new Date())
            )
        })

        if (!record) {
            return { success: false, error: "Invalid or expired OTP" }
        }

        // OTP is valid. Delete it to prevent reuse.
        await db.delete(verificationCodes).where(eq(verificationCodes.id, record.id))

        return { success: true, message: "Phone verified successfully" }

    } catch (error) {
        console.error("Verify OTP Error:", error)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Specifically for logged-in users who need to verify their current number.
 */
export async function sendVerificationOTP() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    });

    if (!user) return { success: false, error: "User not found" };

    return generateAndSendOTP(user.phone, true);
}

/**
 * Verifies OTP and marks the user as verified in the DB.
 */
export async function verifyAndMarkUser(code: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id)
    });

    if (!user) return { success: false, error: "User not found" };

    const result = await verifyOTP(user.phone, code);

    if (result.success) {
        await db.update(users)
            .set({ phoneVerified: new Date() })
            .where(eq(users.id, user.id));

        return { success: true, message: "Phone verified successfully!" };
    }

    return result;
}
