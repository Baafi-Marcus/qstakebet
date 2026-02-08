"use server"

import { db } from "@/lib/db"
import { verificationCodes, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { vynfy } from "@/lib/vynfy-client"
import { randomBytes } from "crypto"

/**
 * Generates a 6-digit OTP, stores it in DB, and sends it via SMS.
 */
export async function generateAndSendOTP(phone: string) {
    if (!phone || phone.length < 10) {
        return { success: false, error: "Invalid phone number" }
    }

    // Check if phone is already registered
    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.phone, phone)
        })

        if (existingUser) {
            return { success: false, error: "Phone number is already associated with an account" }
        }
    } catch (e) {
        console.error("Duplicate phone check error:", e)
        // Proceed if DB check fails for some reason? Or fail safe? 
        // Let's fail safe - we want to ensure uniqueness.
        return { success: false, error: "Internal Error during verification" }
    }

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const id = `vc-${Date.now()}-${randomBytes(4).toString("hex")}`
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

        // Store in DB (delete old codes for this phone first to keep it clean?)
        // Or just insert new one.
        await db.delete(verificationCodes).where(eq(verificationCodes.phone, phone))

        await db.insert(verificationCodes).values({
            id,
            phone,
            code: otp,
            expiresAt
        })

        // Send SMS via Vynfy
        const message = `Your QSTAKEbet verification code is: ${otp}. Valid for 10 minutes.`
        const smsResult = await vynfy.sendSMS([phone], message)

        if (!smsResult.success) {
            console.error("Failed to send OTP SMS:", smsResult.error)
            return { success: false, error: "Failed to send SMS. Please try again." }
        }

        return { success: true, message: "OTP sent successfully" }

    } catch (error) {
        console.error("Generate OTP Error:", error)
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
