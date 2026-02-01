"use server"

import { db } from "@/lib/db"
import { bets, transactions, wallets } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export type SelectionInput = {
    matchId: string
    selectionId: string
    label: string
    odds: number
    marketName: string
    matchLabel: string
}

export async function placeBet(stake: number, selections: SelectionInput[], isBonus: boolean = false) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Please log in to place a bet" }
    }

    if (session.user.role === "admin") {
        return { success: false, error: "Administrators are restricted from placing bets." }
    }

    if (stake < 1) {
        return { success: false, error: "Minimum stake is GHS 1.00" }
    }

    if (selections.length === 0) {
        return { success: false, error: "No selections in bet slip" }
    }

    const userId = session.user.id

    try {
        return await db.transaction(async (tx) => {
            // 1. Get user wallet and check balance
            const userWallets = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)

            if (!userWallets.length) {
                throw new Error("Wallet not found")
            }

            const wallet = userWallets[0]

            // Check balance based on type
            if (isBonus) {
                if (wallet.bonusBalance < stake) {
                    throw new Error("Insufficient bonus balance")
                }
            } else {
                if (wallet.balance < stake) {
                    throw new Error("Insufficient balance")
                }
            }

            // 2. Calculate total odds
            const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)
            const potentialPayout = stake * totalOdds

            // 3. Create the Bet
            const betId = `bet-${Math.random().toString(36).substr(2, 9)}`
            await tx.insert(bets).values({
                id: betId,
                userId,
                stake,
                totalOdds,
                potentialPayout,
                status: "pending",
                selections: selections, // JSONB column
                isBonusBet: isBonus,
                bonusAmountUsed: isBonus ? stake : 0,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            // 4. Deduct stake from correct balance
            if (isBonus) {
                await tx.update(wallets)
                    .set({
                        bonusBalance: sql`${wallets.bonusBalance} - ${stake}`,
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            } else {
                await tx.update(wallets)
                    .set({
                        balance: sql`${wallets.balance} - ${stake}`,
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            }

            // 5. Record the transaction
            await tx.insert(transactions).values({
                id: `txn-${Math.random().toString(36).substring(2, 11)}`,
                userId,
                walletId: wallet.id,
                type: isBonus ? "bonus_stake" : "bet_stake",
                amount: stake,
                balanceBefore: isBonus ? wallet.bonusBalance : wallet.balance,
                balanceAfter: isBonus ? wallet.bonusBalance - stake : wallet.balance - stake,
                paymentStatus: "success",
                description: `Staked on bet ${betId}${isBonus ? " (Bonus)" : ""}`,
                createdAt: new Date()
            })

            return { success: true, betId }
        })
    } catch (error: unknown) {
        console.error("Bet placement error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to place bet. Please try again."
        return { success: false, error: errorMessage }
    }
}
