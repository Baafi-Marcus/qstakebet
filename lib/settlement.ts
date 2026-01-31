import { db } from "@/lib/db"
import { bets, matches, wallets, transactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Bet } from "@/lib/types"

export async function settleMatch(matchId: string) {
    try {
        console.log(`Starting settlement for match: ${matchId}`)

        // 1. Fetch match details (to get the winner)
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData || matchData.length === 0) {
            console.error("Match not found")
            return { success: false, error: "Match not found" }
        }

        const match = matchData[0]
        const result = match.result as { winner?: string, scores?: Record<string, number> } | null

        if (!result?.winner) {
            console.error("Match has no winner declared")
            return { success: false, error: "Match has no winner" }
        }

        const winnerId = result.winner

        // 2. Fetch all PENDING bets for this match
        // Note: bets table doesn't have matchId - selections is jsonb with match info
        const allPendingBets = await db.select().from(bets).where(eq(bets.status, "pending"))

        // Filter bets that are for this match (check selections jsonb)
        const pendingBets = allPendingBets.filter(bet => {
            const selections = bet.selections as Array<{ matchId: string, selectionId: string }> | null
            return selections?.some(s => s.matchId === matchId)
        })

        console.log(`Found ${pendingBets.length} pending bets to settle`)

        let settledCount = 0

        for (const bet of pendingBets) {
            const selections = bet.selections as Array<{ matchId: string, selectionId: string, odds: number }>
            const matchSelection = selections.find(s => s.matchId === matchId)

            if (!matchSelection) continue

            const isWin = matchSelection.selectionId === winnerId
            const newStatus = isWin ? "won" : "lost"
            // Payout calculation
            let payoutAmount = isWin ? bet.potentialPayout : 0

            // Apply Stake Not Returned (SNR) for bonus bets
            // User requested that the stake amount is deducted from winnings for free bets
            if (isWin && (bet as unknown as Bet).isBonusBet) {
                payoutAmount = Math.max(0, payoutAmount - bet.stake)
            }

            // Update Bet Status
            await db.update(bets)
                .set({
                    status: newStatus,
                    settledAt: new Date()
                })
                .where(eq(bets.id, bet.id))

            // If Won, Credit Wallet & Create Transaction
            if (isWin && payoutAmount > 0) {
                // Get current wallet balance
                const userWallet = await db.select().from(wallets)
                    .where(eq(wallets.userId, bet.userId))
                    .limit(1)

                if (userWallet.length === 0) continue

                const wallet = userWallet[0]
                const balanceBefore = wallet.balance
                const balanceAfter = balanceBefore + payoutAmount

                // Update Wallet
                await db.update(wallets)
                    .set({
                        balance: balanceAfter
                    })
                    .where(eq(wallets.userId, bet.userId))

                // Create Transaction Record
                const participants = match.participants as Array<{ name: string }> | null
                await db.insert(transactions).values({
                    id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                    userId: bet.userId,
                    walletId: wallet.id,
                    amount: payoutAmount,
                    type: "bet_payout",
                    balanceBefore,
                    balanceAfter,
                    reference: bet.id,
                    description: `Winnings for match: ${participants?.[0]?.name || 'Match'} vs ${participants?.[1]?.name || ''}`
                })
            }

            settledCount++
        }

        console.log(`Successfully settled ${settledCount} bets`)
        return { success: true, settledCount }

    } catch (error) {
        console.error("Settlement error:", error)
        return { success: false, error: "Failed to settle bets" }
    }
}
