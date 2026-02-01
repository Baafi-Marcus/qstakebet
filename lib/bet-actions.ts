"use server"

import { db } from "@/lib/db"
import { bets, transactions, wallets, matches } from "@/lib/db/schema"
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

    // NEW: Check if any match is locked
    const { getMatchLockStatus } = await import("@/lib/match-utils")

    for (const selection of selections) {
        const matchData = await db.select().from(matches)
            .where(eq(matches.id, selection.matchId))
            .limit(1)

        if (!matchData.length) {
            return { success: false, error: "One or more matches in your betslip were not found." }
        }

        // Cast matchData[0] to any then to Match to avoid complex type issues with jsonb in server actions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lockStatus = getMatchLockStatus(matchData[0] as any)

        if (lockStatus.isLocked) {
            return {
                success: false,
                error: `The match "${selection.matchLabel}" is locked (${lockStatus.reason}). Please remove it to place your bet.`
            }
        }
    }

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

            // 6. Record stake for dynamic odds (after successful transaction)
            const { recordBetStake } = await import("@/lib/odds-engine")
            for (const selection of selections) {
                // We record the portion of the stake for this match
                // For multis, we record the full stake on each selection (liability accumulation)
                await recordBetStake(selection.matchId, selection.selectionId, stake)
            }

            return { success: true, betId }
        })
    } catch (error: unknown) {
        console.error("Bet placement error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to place bet. Please try again."
        return { success: false, error: errorMessage }
    }
}

/**
 * Saves current betslip selections and returns a unique 6-char booking code.
 */
export async function bookBet(selections: SelectionInput[]) {
    if (!selections.length) return { success: false, error: "Slip is empty" }

    try {
        const { bookedBets } = await import("@/lib/db/schema")

        // Generate a 6-char alphanumeric code (no hyphens)
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length))
        }

        const id = `bk-${Math.random().toString(36).substring(2, 11)}`

        await db.insert(bookedBets).values({
            id,
            code,
            selections,
            createdAt: new Date()
        })

        return { success: true, code }
    } catch (error) {
        console.error("Booking error:", error)
        return { success: false, error: "Failed to book bet" }
    }
}

/**
 * Loads selections from a booking code and enriches them with current match status.
 */
export async function loadBookedBet(code: string) {
    if (!code) return { success: false, error: "Please enter a code" }

    try {
        const { bookedBets, matches } = await import("@/lib/db/schema")
        const cleanCode = code.trim().toUpperCase()

        const results = await db.select()
            .from(bookedBets)
            .where(eq(bookedBets.code, cleanCode))
            .limit(1)

        if (!results.length) {
            return { success: false, error: "Booking code not found" }
        }

        const booked = results[0]
        const selections = booked.selections as SelectionInput[]

        // Enrich selections with current match data (status, results)
        const enrichedSelections = await Promise.all(selections.map(async (sel) => {
            const matchData = await db.select().from(matches)
                .where(eq(matches.id, sel.matchId))
                .limit(1)

            if (matchData.length) {
                const match = matchData[0]
                return {
                    ...sel,
                    matchStatus: match.status,
                    matchResult: match.result as any,
                    currentOdds: (match.odds as Record<string, any>)?.[sel.selectionId] || sel.odds // Update odds if changed
                }
            }
            return sel
        }))

        return { success: true, selections: enrichedSelections }
    } catch (error) {
        console.error("Load booking error:", error)
        return { success: false, error: "Failed to load booking code" }
    }
}
