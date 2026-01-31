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

export async function placeBet(stake: number, selections: SelectionInput[]) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "Please log in to place a bet" }
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
            if (wallet.balance < stake) {
                throw new Error("Insufficient balance")
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
                status: "open",
                selections: selections, // JSONB column
                createdAt: new Date(),
                updatedAt: new Date()
            })

            // 4. Deduct stake from wallet
            await tx.update(wallets)
                .set({
                    balance: sql`${wallets.balance} - ${stake}`,
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, wallet.id))

            // 5. Record the transaction
            await tx.insert(transactions).values({
                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                userId,
                walletId: wallet.id,
                type: "bet_stake",
                amount: stake,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance - stake,
                paymentStatus: "success",
                description: `Staked on bet ${betId}`,
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
