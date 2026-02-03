"use server"

import { db } from "@/lib/db"
import { users, wallets, bets, transactions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
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
            columns: { name: true, phone: true, createdAt: true, email: true }
        })

        const wallet = await db.query.wallets.findFirst({
            where: eq(wallets.userId, userId)
        })

        return {
            success: true,
            user,
            balance: wallet?.balance || 0,
            bonusBalance: wallet?.bonusBalance || 0
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Fetches a simple list of user bets for the history page.
 */
export async function getUserBets() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userBets = await db.query.bets.findMany({
            where: eq(bets.userId, session.user.id),
            orderBy: [desc(bets.createdAt)]
        })
        return { success: true, bets: userBets }
    } catch (e) {
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
                bonusBalance: wallet?.bonusBalance || 0
            },
            transactions: history
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}
