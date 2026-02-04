"use server"

import { db } from "@/lib/db"
import { transactions, wallets } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { initiateMomoDeposit } from "./payment/moolre"
import { auth } from "@/lib/auth"

export async function createDeposit(data: {
    amount: number
}) {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const userId = session.user.id
        const email = session.user.email

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
            paymentMethod: "paystack",
            paymentProvider: "paystack",
            description: `Deposit via Paystack`
        })

        // 4. Initiate payment with Paystack
        const { initiatePaystackTransaction } = await import("./payment/paystack")
        const result = await initiatePaystackTransaction({
            amount: data.amount,
            email: email,
            reference
        })

        if (!result.success) {
            return { success: false as const, error: result.error || "Failed to initiate payment" }
        }

        return {
            success: true as const,
            reference,
            authorization_url: result.authorization_url
        }
    } catch (error) {
        console.error("Deposit creation error:", error)
        return { success: false as const, error: "Failed to initiate deposit" }
    }
}

export async function getRecentTransactions(userId: string, limit = 5) {
    return await db.select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(sql`created_at DESC`)
        .limit(limit)
}

export async function initiateWithdrawal(data: {
    amount: number
    phoneNumber: string
    network: 'mtn' | 'telecel' | 'at'
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    try {
        return await db.transaction(async (tx) => {
            // 1. Get wallet and check balance
            const userWallets = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
            if (!userWallets.length) {
                throw new Error("Wallet not found")
            }

            const wallet = userWallets[0]
            if (wallet.balance < data.amount) {
                throw new Error("Insufficient balance for withdrawal")
            }

            // 2. Deduct from wallet immediately (mark as pending withdrawal)
            await tx.update(wallets)
                .set({
                    balance: sql`${wallets.balance} - ${data.amount}`,
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id))

            // 3. Create a pending transaction record
            const reference = `wd-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            await tx.insert(transactions).values({
                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                userId,
                walletId: wallet.id,
                type: "withdrawal",
                amount: data.amount,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance - data.amount,
                paymentReference: reference,
                paymentStatus: "pending",
                paymentMethod: `${data.network}_momo`,
                paymentProvider: "moolre",
                description: `Withdrawal via ${data.network.toUpperCase()}`
            })

            // TODO: In a real production environment, we would call 
            // the Moolre Payout API here or via a background job.
            // For now, we'll simulate the successful request to Moolre

            return { success: true, reference }
        })
    } catch (error: unknown) {
        console.error("Withdrawal error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to process withdrawal"
        return { success: false, error: errorMessage }
    }
}
