"use server"

import { db } from "@/lib/db"
import { users, wallets, bets, transactions, bonuses, matches } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

/**
 * Fetches essential user summary for the minimalist profile page.
 */
export async function getUserProfileSummary() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true, phone: true, createdAt: true, email: true, phoneVerified: true }
        })

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, userId)
        })

        return {
            success: true,
            user,
            balance: wallet?.balance || 0,
            bonusBalance: wallet?.bonusBalance || 0,
            lockedBalance: wallet?.lockedBalance || 0
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Fetches a detailed list of user bets enriched with current match results and status.
 * Required for the high-end Expandable Bets UI.
 */
export async function getUserBetsWithDetails() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const userBets = await db.query.bets.findMany({
            where: eq(bets.userId, userId),
            orderBy: [desc(bets.createdAt)],
            limit: 50
        })

        if (!userBets.length) return { success: true, bets: [] }

        // 1. Collect all unique match IDs from all selections
        const matchIds = new Set<string>()
        userBets.forEach(bet => {
            const selections = bet.selections as any[]
            selections.forEach(s => {
                if (s.matchId) matchIds.add(s.matchId)
            })
        })

        // 2. Fetch current state for all involved matches
        const matchesData = await db.query.matches.findMany({
            where: sql`${matches.id} IN ${Array.from(matchIds)}`
        })

        // 3. Map matches for easy lookup
        const matchLookup = new Map(matchesData.map(m => [m.id, m]))

        // 4. Enrich bets with live match data
        const enrichedBets = userBets.map(bet => {
            const selections = (bet.selections as any[]).map(s => {
                const currentMatch = matchLookup.get(s.matchId)
                return {
                    ...s,
                    currentMatch: currentMatch ? {
                        status: currentMatch.status,
                        result: currentMatch.result,
                        isLive: currentMatch.isLive,
                        startTime: currentMatch.startTime
                    } : null
                }
            })

            return {
                ...bet,
                selections
            }
        })

        return { success: true, bets: enrichedBets }
    } catch (e) {
        console.error("Get user bets with details error:", e)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Fetches wallet info and transaction history for the wallet page.
 */
export async function getUserWalletDetails() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, userId)
        })

        const history = await db.query.transactions.findMany({
            where: eq(transactions.userId, userId),
            orderBy: [desc(transactions.createdAt)],
            limit: 20
        })

        return {
            success: true,
            wallet: {
                balance: wallet?.balance || 0,
                bonusBalance: wallet?.bonusBalance || 0,
                lockedBalance: wallet?.lockedBalance || 0
            },
            transactions: history
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}
/**
 * Updates user profile information.
 */
export async function updateUserProfile(formData: { name?: string; phone?: string }) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        await db.update(users)
            .set({
                name: formData.name,
                phone: formData.phone,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (e) {
        console.error("Update profile error:", e)
        return { success: false, error: "Internal Error" }
    }
}
/**
 * Fetches the count of active bonuses for the user.
 */
export async function getUserBonusesCount() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, count: 0 }

    try {
        const result = await db.select({
            count: sql<number>`count(*)`
        })
            .from(bonuses)
            .where(and(
                eq(bonuses.userId, session.user.id),
                eq(bonuses.status, "active")
            ))

        return { success: true, count: Number(result[0]?.count) || 0 }
    } catch (e) {
        console.error("Get bonuses count error:", e)
        return { success: false, count: 0 }
    }
}

/**
 * Fetches the list of active bonuses/gifts for the user.
 */
export async function getUserGifts() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, gifts: [] }

    try {
        const activeGifts = await db.query.bonuses.findMany({
            where: and(
                eq(bonuses.userId, session.user.id),
                eq(bonuses.status, "active")
            ),
            orderBy: [desc(bonuses.expiresAt)]
        })

        return { success: true, gifts: activeGifts }
    } catch (e) {
        console.error("Get user gifts error:", e)
        return { success: false, gifts: [] }
    }
}
