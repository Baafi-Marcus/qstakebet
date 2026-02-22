"use server"

import { db } from "@/lib/db"
import { referralClicks, users, bonuses, wallets, transactions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

/**
 * Tracks a unique link click for a referral code.
 * If unique and reaches 10 clicks, issues a 2 GHS free bet.
 */
export async function trackLinkClick(referralCode: string, ip: string, userAgent: string) {
    try {
        // 1. Check if this IP has already clicked this code
        const existing = await db.query.referralClicks.findFirst({
            where: and(
                eq(referralClicks.referralCode, referralCode),
                eq(referralClicks.ipAddress, ip)
            )
        })

        if (existing) {
            return { success: false, reason: "duplicate_click" }
        }

        // 2. Log the click
        await db.insert(referralClicks).values({
            id: `clk-${nanoid(10)}`,
            referralCode,
            ipAddress: ip,
            userAgent
        })

        // 3. Increment user's click count
        const user = await db.query.users.findFirst({
            where: eq(users.referralCode, referralCode)
        })

        if (!user) return { success: false, reason: "invalid_code" }

        const newClickCount = user.linkClicks + 1

        await db.update(users)
            .set({ linkClicks: newClickCount })
            .where(eq(users.id, user.id))

        // 4. Check for reward (10 clicks)
        if (newClickCount >= 10 && !user.linkClicksRewardClaimed) {
            // Issue 2 GHS Free Bet
            await db.insert(bonuses).values({
                id: `bns-${nanoid(10)}`,
                userId: user.id,
                type: "referral_clicks",
                amount: 2.00,
                status: "active",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            })

            // Update user to mark reward as claimed
            await db.update(users)
                .set({ linkClicksRewardClaimed: true })
                .where(eq(users.id, user.id))

            return { success: true, rewarded: true }
        }

        return { success: true }
    } catch (error) {
        console.error("Failed to track link click:", error)
        return { success: false, error: "Internal Error" }
    }
}
