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

export async function placeBet(stake: number, selections: SelectionInput[], bonusId?: string, bonusAmount: number = 0, mode: 'single' | 'multi' = 'multi') {
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
        // Skip DB check for virtual matches as they are ephemeral
        if (selection.matchId.startsWith('vmt-')) {
            continue;
        }

        const matchData = await db.select().from(matches)
            .where(eq(matches.id, selection.matchId))
            .limit(1)

        if (!matchData.length) {
            return { success: false, error: "One or more matches in your betslip were not found." }
        }

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

            // Calculate required cash stake
            const cashAmount = Math.max(0, stake - bonusAmount)

            // Validate Gift usage if applicable
            if (bonusAmount > 0) {
                if (wallet.bonusBalance < bonusAmount) {
                    throw new Error("Insufficient bonus balance for the selected gift amount.")
                }
            }

            // Validate Cash balance
            if (cashAmount > 0) {
                if (wallet.balance < cashAmount) {
                    throw new Error("Insufficient balance to cover the remaining stake.")
                }
            }

            // 2. Calculate total odds and Potential Payout
            const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)

            let potentialPayout = 0
            if (mode === 'single') {
                const stakePerSelection = stake / selections.length
                potentialPayout = selections.reduce((acc, s) => acc + (stakePerSelection * s.odds), 0)
            } else {
                potentialPayout = stake * totalOdds
            }

            let bonusGiftAmount = 0
            // Multi-Bonus only applies to cash multi-bets of 3+ legs
            if (selections.length >= 3 && bonusAmount === 0 && mode === 'multi') {
                const { MULTI_BONUS } = await import("@/lib/constants")
                const count = selections.length
                let bonusPct = 0

                Object.entries(MULTI_BONUS.SCALING)
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .some(([threshold, percent]) => {
                        if (count >= Number(threshold)) {
                            bonusPct = Number(percent)
                            return true
                        }
                        return false
                    })

                const baseWin = potentialPayout
                const rawBonus = baseWin * (bonusPct / 100)
                bonusGiftAmount = Math.min(rawBonus, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP)
            }

            potentialPayout += bonusGiftAmount

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
                isBonusBet: bonusAmount > 0,
                bonusUsed: bonusId,
                bonusAmountUsed: bonusAmount,
                bonusGiftAmount: bonusGiftAmount,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            // 4. Deduct balances
            if (bonusAmount > 0) {
                // If a specific bonus voucher was used, update its individual record
                if (bonusId) {
                    const { bonuses } = await import("@/lib/db/schema")
                    const bonusData = await tx.select().from(bonuses).where(eq(bonuses.id, bonusId)).limit(1)

                    if (bonusData.length > 0) {
                        const currentBonus = bonusData[0]
                        const newBonusAmount = Math.max(0, currentBonus.amount - bonusAmount)

                        await tx.update(bonuses)
                            .set({
                                amount: newBonusAmount,
                                status: newBonusAmount <= 0 ? "used" : "active",
                                usedAt: new Date(),
                                betId: betId
                            })
                            .where(eq(bonuses.id, bonusId))
                    }
                }

                // ALWAYS deduct from the wallet's cumulative bonusBalance if bonusAmount > 0
                await tx.update(wallets)
                    .set({
                        bonusBalance: sql`${wallets.bonusBalance} - ${bonusAmount}`,
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            }

            if (cashAmount > 0) {
                await tx.update(wallets)
                    .set({
                        balance: sql`${wallets.balance} - ${cashAmount}`,
                        turnoverWagered: sql`${wallets.turnoverWagered} + ${cashAmount}`,
                        updatedAt: new Date()
                    })
                    .where(eq(wallets.id, wallet.id))
            }

            // 5. Record the transaction
            const isBonus = bonusAmount > 0
            await tx.insert(transactions).values({
                id: `txn-${Math.random().toString(36).substring(2, 11)}`,
                userId,
                walletId: wallet.id,
                type: isBonus ? "bonus_stake" : "bet_stake",
                amount: stake,
                balanceBefore: isBonus ? wallet.bonusBalance : wallet.balance,
                balanceAfter: isBonus ? wallet.bonusBalance - bonusAmount : wallet.balance - cashAmount,
                paymentStatus: "success",
                description: `Staked on bet ${betId}${isBonus ? ` (GHS ${bonusAmount} Gift)` : ""}`,
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

        // Sort selections to ensure consistent fingerprinting (idempotency)
        const sortedSelections = [...selections].sort((a, b) => {
            if (a.matchId !== b.matchId) return a.matchId.localeCompare(b.matchId)
            return a.selectionId.localeCompare(b.selectionId)
        })

        // Check if this exact slip (same matches + same markets) has been booked before
        // We use sql comparison for jsonb content
        const existing = await db.select()
            .from(bookedBets)
            .where(sql`${bookedBets.selections}::jsonb = ${JSON.stringify(sortedSelections)}::jsonb`)
            .limit(1)

        if (existing.length > 0) {
            return { success: true, code: existing[0].code }
        }

        // Generate a 6-char alphanumeric code (no hyphens)
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars
        let code = ''
        const existingCodes = await db.select({ code: bookedBets.code }).from(bookedBets)
        const codeSet = new Set(existingCodes.map(c => c.code))

        // Ensure uniqueness for the new code
        let isUnique = false
        while (!isUnique) {
            code = ''
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length))
            }
            if (!codeSet.has(code)) isUnique = true
        }

        const id = `bk-${Math.random().toString(36).substring(2, 11)}`

        await db.insert(bookedBets).values({
            id,
            code,
            selections: sortedSelections,
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
