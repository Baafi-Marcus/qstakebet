import { db } from "@/lib/db"
import { bets, matches, wallets, transactions } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { Bet, Match } from "@/lib/types"

export async function settleMatch(matchId: string) {
    try {
        console.log(`Starting settlement for match: ${matchId}`)

        // 1. Fetch match details
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData || matchData.length === 0) {
            console.error("Match not found")
            return { success: false, error: "Match not found" }
        }

        const match = matchData[0] as unknown as Match
        const result = match.result as {
            winner?: string,
            scores?: Record<string, number>,
            metadata?: Record<string, unknown>
        } | null

        if (!result?.winner && match.status !== 'cancelled') {
            console.error("Match has no winner declared")
            return { success: false, error: "Match has no winner" }
        }

        const isVoid = match.status === 'cancelled' || result?.winner === 'void' || result?.winner === 'cancelled'

        // 2. Fetch all PENDING bets for this match
        const allPendingBets = await db.select().from(bets).where(eq(bets.status, "pending"))
        const pendingBets = allPendingBets.filter(bet => {
            const selections = bet.selections as unknown as Array<{ matchId: string }> | null
            return selections?.some(s => s.matchId === matchId)
        })

        console.log(`Found ${pendingBets.length} pending bets to settle`)

        let settledCount = 0

        for (const bet of pendingBets) {
            const selections = bet.selections as unknown as Array<{
                matchId: string,
                selectionId: string,
                odds: number,
                marketName?: string,
                label?: string,
                status?: string // Track individual leg status
            }>

            // Handle Void Match
            if (isVoid) {
                // Find legs for this match and mark them void
                const updatedSelections = selections.map(s => {
                    if (s.matchId === matchId) {
                        return { ...s, status: 'void', odds: 1.00 } // Set odds to 1.00
                    }
                    return s
                })

                // Recalculate Total Odds
                const newTotalOdds = updatedSelections.reduce((acc, curr) => acc * curr.odds, 1)

                // Recalculate Bonus
                let newBonusGiftAmount = 0
                if (updatedSelections.length >= 3 && !bet.isBonusBet) {
                    const { MULTI_BONUS } = await import("@/lib/constants")
                    const count = updatedSelections.length
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

                    const baseWin = bet.stake * newTotalOdds
                    const rawBonus = baseWin * (bonusPct / 100)
                    newBonusGiftAmount = Math.min(rawBonus, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP)
                }

                const newPayout = (bet.stake * newTotalOdds) + newBonusGiftAmount

                // Update Bet with new odds/payout/bonus
                await db.update(bets).set({
                    selections: updatedSelections,
                    totalOdds: newTotalOdds,
                    potentialPayout: newPayout,
                    bonusGiftAmount: newBonusGiftAmount,
                    updatedAt: new Date()
                }).where(eq(bets.id, bet.id))

                // If it was a Single Bet, it is now WON (Refunded) but strictly it's a "Void Refund"
                if (updatedSelections.length === 1) {
                    const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                    if (userWallet.length > 0) {
                        const balanceBefore = parseFloat(userWallet[0].balance.toString())
                        const balanceAfter = balanceBefore + newPayout

                        await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                        await db.insert(transactions).values({
                            id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                            userId: bet.userId,
                            walletId: userWallet[0].id,
                            amount: newPayout,
                            type: "bet_payout",
                            balanceBefore,
                            balanceAfter,
                            reference: bet.id,
                            description: `Refund (Void): ${match.participants?.[0]?.name || 'Match'} vs ${match.participants?.[1]?.name || 'Opponent'}`
                        })
                    }

                    await db.update(bets).set({ status: 'void', settledAt: new Date() }).where(eq(bets.id, bet.id))
                    settledCount++
                    continue;
                }

                // For multis with other pending legs, we just updated the odds. 
                // We do NOT mark the whole bet as settled unless all legs are done (task for another time).
                continue;
            }

            // For now, we only support single bets or accumulators that are all purely decided
            // We iterate through selections. If ANY selection in the bet is for THIS match, we check it.
            // If it's a multi-bet, we just update the status of the *leg* conceptually (not yet implemented fully for parlay legs)
            // But current logic treats the whole bet as "Won" or "Lost" based on single validation?
            // The existing code assumed single bets or simple logic. 
            // We will ASSUME single bets logic for settlement simplicity here or process specific match legs.

            // To properly handle multis, we'd need a more complex "Leg Status" system.
            // For now, let's assume if it's a single bet on this match, we settle it.
            // OR if it's a multi, we check if this match makes it LOSE.

            const matchSelection = selections.find(s => s.matchId === matchId)
            if (!matchSelection) continue

            const { selectionId, marketName, label } = matchSelection

            // If we are here, it's NOT a void match, so result must be valid
            if (!result) continue; // Should catch by earlier check but safety first

            const isWin = isSelectionWinner(selectionId, marketName || "Match Winner", label || "", match, result)

            // Leg status update logic
            const updatedSelections = selections.map(s => {
                if (s.matchId === matchId) {
                    return { ...s, status: isWin ? 'won' : 'lost' }
                }
                return s
            })

            let newStatus: "pending" | "won" | "lost" = "pending"

            if (!isWin) {
                newStatus = "lost"
            } else {
                // If this leg won, check if all other legs are ALSO decided
                const allFinished = updatedSelections.every(s => s.status === 'won' || s.status === 'void')
                if (allFinished) {
                    newStatus = "won"
                } else {
                    // Update the selection statuses in DB but keep bet as pending
                    await db.update(bets).set({
                        selections: updatedSelections,
                        updatedAt: new Date()
                    }).where(eq(bets.id, bet.id))
                    continue
                }
            }

            let payoutAmount = (newStatus === "won") ? bet.potentialPayout : 0

            // GIFT RULE: Profit only for bonus bets
            if (newStatus === "won" && bet.isBonusBet) {
                payoutAmount = Math.max(0, payoutAmount - bet.stake);
            }

            // Update Bet Status
            await db.update(bets)
                .set({
                    status: newStatus,
                    selections: updatedSelections,
                    settledAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(bets.id, bet.id))

            // Credit Wallet if Won
            if (newStatus === "won" && payoutAmount > 0) {
                const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                if (userWallet.length > 0) {
                    const wallet = userWallet[0]

                    // Consolidation: All match winnings go to main balance
                    await db.update(wallets)
                        .set({
                            balance: sql`${wallets.balance} + ${payoutAmount}`,
                            updatedAt: new Date()
                        })
                        .where(eq(wallets.userId, bet.userId))

                    await db.insert(transactions).values({
                        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: wallet.id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore: wallet.balance,
                        balanceAfter: Number(wallet.balance) + payoutAmount,
                        reference: bet.id,
                        description: `Winnings: ${marketName || 'Match Winner'} - ${label || 'Selection'}`
                    })
                }
            }
            settledCount++
        }

        return { success: true, settledCount }

    } catch (error) {
        console.error("Settlement error:", error)
        return { success: false, error: "Failed to settle bets" }
    }
}

/**
 * Intelligent Market Settlement Logic
 */
export function isSelectionWinner(
    selectionId: string,
    marketName: string,
    label: string,
    match: Match,
    result: { winner?: string, scores?: Record<string, number>, metadata?: Record<string, unknown> }
): boolean {
    const sport = (match.sportType || 'football').toLowerCase()
    const metadata = result.metadata || {}
    const scores = result.scores || {}
    const participants = match.participants || []

    // Virtuals Adapter: If it's a virtual match outcome
    const isVirtualOutcome = (result as any).winnerIndex !== undefined && Array.isArray((result as any).totalScores);
    const vOutcome = isVirtualOutcome ? (result as any) : null;

    // Normalize Market Name
    const market = marketName.toLowerCase().trim()

    // 1. MATCH WINNER (1X2 / 12)
    if (market === "match winner" || market === "1x2" || market === "win" || market === "12") {
        if (selectionId === "X" || label === "Draw") {
            // Check for Draw (Football, Handball, Quiz)
            if (isVirtualOutcome) {
                const vScores = vOutcome.totalScores;
                if (vScores.length === 2) return vScores[0] === vScores[1];
                if (vScores.length === 3) return vScores[0] === vScores[1] && vScores[1] === vScores[2];
                return false;
            }
            const values = Object.values(scores)
            return values.length >= 2 && values.every(v => v === values[0])
        }

        if (isVirtualOutcome) {
            // selectionId for virtuals is usually "1", "2", "3" (indices 1-indexed) or the name
            const winnerName = vOutcome.schools[vOutcome.winnerIndex];
            if (selectionId === "1") return vOutcome.winnerIndex === 0;
            if (selectionId === "2") return vOutcome.winnerIndex === 1;
            if (selectionId === "3") return vOutcome.winnerIndex === 2;
            return winnerName === selectionId;
        }

        // Standard logic
        if (result.winner === selectionId) return true;

        // Final score check if winner isn't explicitly set but scores are
        if (scores[selectionId] !== undefined) {
            const myScore = scores[selectionId];
            const otherScores = Object.entries(scores).filter(([id]) => id !== selectionId).map(([_, s]) => s);
            return otherScores.every(os => myScore > os);
        }

        return false;
    }

    // 2. TOTAL POINTS / GOALS (Over/Under)
    // Label format: "Over 2.5", "Under 140.5"
    if (market.includes("total") || market.includes("over/under")) {
        const totalScore = isVirtualOutcome
            ? (vOutcome.totalScores as number[]).reduce((a, b) => a + b, 0)
            : Object.values(scores).reduce((a, b) => a + b, 0)

        const parts = label.split(" ")
        const lineStr = parts[parts.length - 1]
        const line = parseFloat(lineStr)

        if (isNaN(line)) return false

        if (label.toLowerCase().includes("over")) return totalScore > line
        if (label.toLowerCase().includes("under")) return totalScore < line
    }

    // 3. HANDICAP / SPREAD
    // Label format: "School Name +2.5", "Opponent -10.5"
    if (market.includes("handicap") || market.includes("spread")) {
        const lineSign = label.includes("+") ? "+" : "-"
        const [targetName, lineValueStr] = label.split(lineSign)
        const line = parseFloat(`${lineSign}${lineValueStr}`)

        const participant = participants.find(p => p.name.trim().toLowerCase() === targetName.trim().toLowerCase() || p.schoolId === selectionId)
        if (!participant) return false

        const targetId = participant.schoolId
        const participantIdx = participants.findIndex(p => p.schoolId === targetId)

        const myScore = isVirtualOutcome ? vOutcome.totalScores[participantIdx] : (scores[targetId] || 0)
        const adjustedScore = myScore + line

        const otherScores = isVirtualOutcome
            ? (vOutcome.totalScores as number[]).filter((_, idx) => idx !== participantIdx)
            : Object.entries(scores).filter(([id]) => id !== targetId).map(([_, s]) => s)

        return otherScores.every(os => adjustedScore > os)
    }

    // 4. WINNING MARGIN
    if (market.includes("margin")) {
        const values = isVirtualOutcome ? vOutcome.totalScores : Object.values(scores)
        if (values.length < 2) return false

        const sorted = [...values].sort((a, b) => b - a);
        const diff = Math.abs(sorted[0] - (sorted[1] || 0))

        if (label === "Draw" || label === "0") return diff === 0

        if (label.includes("-")) {
            const [min, max] = label.split("-").map(Number)
            return diff >= min && diff <= max
        }
        if (label.includes("+")) {
            const min = parseFloat(label)
            return diff >= min
        }
    }

    // 5. PODIUM / TOP FINISH (Athletics)
    // selectionId: user's pick. result.metadata.podium: array of IDs in order.
    if (market.includes("podium") || market.includes("top 3")) {
        const podium = (metadata.podium || []) as string[]
        return podium.slice(0, 3).includes(selectionId)
    }

    // 6. HEAD-TO-HEAD (Athletics/Matchups)
    if (market === "h2h" || market === "matchup") {
        // label usually describes the matchup "A vs B"
        // result.winner or scores determine this
        if (isVirtualOutcome) return vOutcome.winnerIndex === (parseInt(selectionId) - 1);
        return result.winner === selectionId;
    }

    // 7. QUIZ SPECIFIC: Round Winners
    if (market.includes("round") && market.includes("winner")) {
        const roundNum = market.match(/\d+/)?.[0]
        if (!roundNum) return false
        const roundIndex = parseInt(roundNum) - 1;

        if (isVirtualOutcome) {
            const roundScores = vOutcome.rounds[roundIndex].scores;
            const max = Math.max(...roundScores);
            const winners = roundScores.map((s: number, i: number) => s === max ? i : -1).filter((i: number) => i !== -1);
            const selIdx = parseInt(selectionId) - 1;
            return winners.includes(selIdx);
        }

        const roundKey = `r${roundNum}`
        const roundScores = (metadata.quizDetails as Record<string, Record<string, number>>)?.[roundKey] || {}
        let maxScore = -999; let winner = "";
        Object.entries(roundScores).forEach(([id, score]) => {
            if (score > maxScore) { maxScore = score; winner = id; }
        })
        return winner === selectionId
    }

    // 8. GENERIC PROPS
    const cleanKey = market.replace(/\s+/g, "")
    const propMap: Record<string, string> = {
        perfectround: 'perfectRound',
        shutoutround: 'shutoutRound',
        comebackwin: 'comebackWin',
        leadchanges: 'leadChanges',
        firstbonus: 'firstBonusIndex',
        latesurge: 'lateSurgeIndex',
        strongstart: 'strongStartIndex'
    };

    if (isVirtualOutcome && propMap[cleanKey]) {
        const statKey = propMap[cleanKey];
        const val = vOutcome.stats[statKey];

        if (cleanKey === 'perfectround' || cleanKey === 'shutoutround') {
            const isYes = (val as boolean[]).some(v => v);
            return (label === "Yes" && isYes) || (label === "No" && !isYes);
        }
        if (cleanKey === 'comebackwin') return (label === "Yes" && val) || (label === "No" && !val);
        if (cleanKey === 'leadchanges') return (label === "Yes" && val > 0) || (label === "No" && val === 0);

        const schoolIdx = parseInt(selectionId) - 1;
        return val === schoolIdx;
    }

    // Metadata fallback
    if (metadata[cleanKey] !== undefined) {
        return (metadata[cleanKey] === true && label === "Yes") || (metadata[cleanKey] === false && label === "No")
    }

    // Default Fallback
    if (isVirtualOutcome) return vOutcome.winnerIndex === (parseInt(selectionId) - 1);
    return result.winner === selectionId
}
