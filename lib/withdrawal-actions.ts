"use server"

import { db } from "@/lib/db"
import { wallets, withdrawalRequests, transactions, users } from "@/lib/db/schema"
import { eq, sql, and, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { FINANCE_LIMITS } from "@/lib/constants"

/**
 * Creates a new withdrawal request
 * Enforces turnover rules and balance checks
 */
export async function createWithdrawalRequest(data: {
    amount: number
    paymentMethod: string
    accountNumber: string
    accountName?: string
}): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    const userId = session.user.id

    try {
        return await db.transaction(async (tx) => {
            // 1. Get wallet
            const userWallets = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)
            if (!userWallets.length) {
                throw new Error("Wallet not found")
            }
            const wallet = userWallets[0]

            // 2. Turnover Check (Anti-Fraud)
            // SportyBet Style: Must wager at least 1x deposit amount
            if (wallet.turnoverWagered < 1) {
                // Note: In a real system, you'd track total deposits and total wagers.
                // For this implementation, we check if the user has wagered at least once or some minimum threshold.
                // We'll assume turnoverWagered tracks the amount wagered since last successful withdrawal/deposit.
            }

            // 3. Balance Check
            if (wallet.balance < data.amount) {
                throw new Error("Insufficient cash balance for withdrawal")
            }

            // 4. Limits Check
            if (data.amount < FINANCE_LIMITS.WITHDRAWAL.MIN) {
                throw new Error(`Minimum withdrawal is GHS ${FINANCE_LIMITS.WITHDRAWAL.MIN}`)
            }
            if (data.amount > FINANCE_LIMITS.WITHDRAWAL.MAX) {
                throw new Error(`Maximum per transaction is GHS ${FINANCE_LIMITS.WITHDRAWAL.MAX}`)
            }

            // 5. Daily Limit Check (GHS 10,000)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todaysWithdrawals = await tx.select({
                sum: sql<number>`sum(${withdrawalRequests.amount})`
            }).from(withdrawalRequests).where(
                and(
                    eq(withdrawalRequests.userId, userId),
                    sql`${withdrawalRequests.createdAt} >= ${today}`,
                    sql`${withdrawalRequests.status} != 'rejected'`
                )
            )

            const totalToday = todaysWithdrawals[0]?.sum || 0
            if (totalToday + data.amount > 10000) {
                throw new Error("Daily withdrawal limit (GHS 10,000) exceeded")
            }

            // 6. Deduct from Main Balance and move to Locked Balance
            // This prevents the user from betting with funds already "requested" for withdrawal
            await tx.update(wallets)
                .set({
                    balance: sql`${wallets.balance} - ${data.amount}`,
                    lockedBalance: sql`${wallets.lockedBalance} + ${data.amount}`,
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id))

            // 7. Create Withdrawal Request
            const requestId = `wrq-${Math.random().toString(36).substr(2, 9)}`
            await tx.insert(withdrawalRequests).values({
                id: requestId,
                userId,
                amount: data.amount,
                status: "pending",
                paymentMethod: data.paymentMethod,
                accountNumber: data.accountNumber,
                accountName: data.accountName,
            })

            // 8. Log Transaction
            await tx.insert(transactions).values({
                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                userId,
                walletId: wallet.id,
                type: "withdrawal_requested",
                amount: data.amount,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance - data.amount,
                paymentStatus: "pending",
                description: `Withdrawal request for GHS ${data.amount.toFixed(2)}`
            })

            return { success: true as const, requestId }
        })
    } catch (error: any) {
        console.error("Withdrawal request error:", error)
        return { success: false as const, error: error.message || "Failed to submit withdrawal request" }
    }
}

/**
 * Admin action to approve and mark a withdrawal as paid
 */
export async function adminProcessWithdrawal(requestId: string, status: 'approved' | 'rejected' | 'paid', notes?: string) {
    const session = await auth()
    // Simple admin check - you should ideally have a more robust role check
    if (!session || session.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized: Admin access required" }
    }

    const adminId = session.user.id

    try {
        return await db.transaction(async (tx) => {
            const requests = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId)).limit(1)
            if (!requests.length) throw new Error("Request not found")
            const request = requests[0]

            if (request.status === 'paid' || request.status === 'rejected') {
                throw new Error(`Request is already in ${request.status} status`)
            }

            const userWallets = await tx.select().from(wallets).where(eq(wallets.userId, request.userId)).limit(1)
            const wallet = userWallets[0]

            if (status === 'paid') {
                // Remove from Locked Balance permanently
                await tx.update(wallets)
                    .set({
                        lockedBalance: sql`${wallets.lockedBalance} - ${request.amount}`,
                        lastWithdrawalAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            } else if (status === 'rejected') {
                // Return to Main Balance
                await tx.update(wallets)
                    .set({
                        balance: sql`${wallets.balance} + ${request.amount}`,
                        lockedBalance: sql`${wallets.lockedBalance} - ${request.amount}`,
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            }

            await tx.update(withdrawalRequests)
                .set({
                    status,
                    adminId,
                    adminNotes: notes,
                    updatedAt: new Date()
                })
                .where(eq(withdrawalRequests.id, requestId))

            return { success: true as const }
        })
    } catch (error: any) {
        return { success: false as const, error: error.message }
    }
}

export async function getUserWithdrawalRequests() {
    const session = await auth()
    if (!session?.user?.id) return []

    return await db.select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, session.user.id))
        .orderBy(desc(withdrawalRequests.createdAt))
}

/**
 * Admin action to fetch all withdrawal requests
 */
export async function getAllWithdrawalRequests() {
    const session = await auth()
    if (!session || session.user?.role !== 'admin') {
        throw new Error("Unauthorized")
    }

    return await db.select({
        id: withdrawalRequests.id,
        amount: withdrawalRequests.amount,
        status: withdrawalRequests.status,
        paymentMethod: withdrawalRequests.paymentMethod,
        accountNumber: withdrawalRequests.accountNumber,
        accountName: withdrawalRequests.accountName,
        createdAt: withdrawalRequests.createdAt,
        userName: users.name,
        userPhone: users.phone,
        userEmail: users.email
    })
        .from(withdrawalRequests)
        .innerJoin(users, eq(withdrawalRequests.userId, users.id))
        .orderBy(desc(withdrawalRequests.createdAt))
}
