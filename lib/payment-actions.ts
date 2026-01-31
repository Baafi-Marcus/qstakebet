"use server"

import { db } from "@/lib/db"
import { transactions, wallets } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { initiateMomoDeposit } from "./payment/moolre"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createDeposit(data: {
    amount: number
    phoneNumber: string
    network: 'mtn' | 'telecel' | 'at'
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const userId = session.user.id

        // 1. Get user wallet
        const wallet = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
        if (!wallet.length) {
            return { success: false, error: "Wallet not found" }
        }

        // 2. Generate a unique reference
        const reference = `dep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

        // 3. Create a pending transaction in our database
        await db.insert(transactions).values({
            id: `txn-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            walletId: wallet[0].id,
            type: "deposit",
            amount: data.amount,
            balanceBefore: wallet[0].balance,
            balanceAfter: wallet[0].balance, // Balance stays same until confirmed
            paymentReference: reference,
            paymentStatus: "pending",
            paymentMethod: `${data.network}_momo`,
            paymentProvider: "moolre",
            description: `Deposit via ${data.network.toUpperCase()}`
        })

        // 4. Initiate payment with Moolre
        const result = await initiateMomoDeposit({
            amount: data.amount,
            phoneNumber: data.phoneNumber,
            network: data.network,
            customerName: session.user.name || "User",
            customerEmail: session.user.email,
            reference
        })

        if (!result.success) {
            return { success: false, error: result.error || "Failed to initiate payment" }
        }

        return { success: true, reference }
    } catch (error) {
        console.error("Deposit creation error:", error)
        return { success: false, error: "Failed to initiate deposit" }
    }
}

export async function getRecentTransactions(userId: string, limit = 5) {
    return await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(sql`created_at DESC`)
        .limit(limit)
}
