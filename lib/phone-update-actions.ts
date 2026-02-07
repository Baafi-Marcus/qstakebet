"use server"

import { db } from "@/lib/db"
import { users, verificationCodes } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { generateAndSendOTP, verifyOTP } from "@/lib/verification-actions"
import { formatPhoneNumber, isValidGhanaPhone } from "@/lib/phone-utils"

/**
 * Initiates phone number update by sending OTP to new number
 */
export async function requestPhoneUpdate(newPhone: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Validate phone number
        const formattedPhone = formatPhoneNumber(newPhone);

        if (!isValidGhanaPhone(formattedPhone)) {
            return { success: false, error: "Invalid phone number format" };
        }

        // Check if phone is already in use
        const existingUser = await db.query.users.findFirst({
            where: eq(users.phone, formattedPhone)
        });

        if (existingUser && existingUser.id !== session.user.id) {
            return { success: false, error: "Phone number already in use" };
        }

        // Send OTP to new number
        const otpResult = await generateAndSendOTP(formattedPhone);

        if (!otpResult.success) {
            return { success: false, error: otpResult.error || "Failed to send OTP" };
        }

        return {
            success: true,
            message: "Verification code sent to new number",
            phone: formattedPhone
        };
    } catch (error) {
        console.error("Request phone update error:", error);
        return { success: false, error: "Failed to process request" };
    }
}

/**
 * Confirms phone number update after OTP verification
 */
export async function confirmPhoneUpdate(newPhone: string, otp: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const formattedPhone = formatPhoneNumber(newPhone);

        // Verify OTP
        const verification = await verifyOTP(formattedPhone, otp);

        if (!verification.success) {
            return { success: false, error: verification.error || "Invalid OTP" };
        }

        // Check again if phone is still available
        const existingUser = await db.query.users.findFirst({
            where: eq(users.phone, formattedPhone)
        });

        if (existingUser && existingUser.id !== session.user.id) {
            return { success: false, error: "Phone number already in use" };
        }

        // Update user's phone number
        await db.update(users)
            .set({
                phone: formattedPhone,
                phoneVerified: new Date(),
                updatedAt: new Date()
            })
            .where(eq(users.id, session.user.id));

        return {
            success: true,
            message: "Phone number updated successfully"
        };
    } catch (error) {
        console.error("Confirm phone update error:", error);
        return { success: false, error: "Failed to update phone number" };
    }
}
