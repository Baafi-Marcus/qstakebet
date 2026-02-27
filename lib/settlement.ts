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
                status?: string // Track individual leg status (won, lost, void, pending)
            }>

            // Skip if this bet has already been settled for this match (safety)
            if (bet.status !== "pending") continue;

            // Handle Void Match
            if (isVoid) {
                // Find legs for this match and mark them void
                const updatedSelections = selections.map(s => {
                    if (s.matchId === matchId && s.status === 'pending') {
                        return { ...s, status: 'void', odds: 1.00 } // Set odds to 1.00 for void
                    }
                    return s
                })

                // Recalculate Total Odds
                const newTotalOdds = updatedSelections.reduce((acc, curr) => acc * curr.odds, 1)

                // Recalculate Bonus
                let newBonusGiftAmount = 0
                if (updatedSelections.length >= 3 && !bet.isBonusBet) {
                    const { MULTI_BONUS } = await import("@/lib/constants")
                    const count = updatedSelections.filter(s => s.status !== 'void').length
                    let bonusPct = 0

                    if (count >= 3) {
                        Object.entries(MULTI_BONUS.SCALING)
                            .sort((a, b) => Number(b[0]) - Number(a[0]))
                            .some(([threshold, percent]) => {
                                if (count >= Number(threshold)) {
                                    bonusPct = Number(percent)
                                    return true
                                }
                                return false
                            })
                    }

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

                // If all legs are now finished (won/lost/void), settle the bet
                const allFinished = updatedSelections.every(s => s.status !== 'pending')
                if (allFinished) {
                    const isAllWinOrVoid = updatedSelections.every(s => s.status === 'won' || s.status === 'void')
                    const finalStatus = isAllWinOrVoid ? 'won' : 'lost'

                    if (finalStatus === 'won') {
                        const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                        if (userWallet.length > 0) {
                            const balanceBefore = parseFloat(userWallet[0].balance.toString())
                            const payout = (bet.isBonusBet && updatedSelections.length === 1) ? (newPayout - bet.stake) : newPayout
                            const balanceAfter = balanceBefore + Math.max(0, payout)

                            await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                            await db.insert(transactions).values({
                                id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                                userId: bet.userId,
                                walletId: userWallet[0].id,
                                amount: Math.max(0, payout),
                                type: "bet_payout",
                                balanceBefore,
                                balanceAfter,
                                reference: bet.id,
                                description: `Refund/Win (All Legs Decided): ${bet.id}`
                            })
                        }
                    }

                    await db.update(bets).set({
                        status: isAllWinOrVoid ? (updatedSelections.every(s => s.status === 'void') ? 'void' : 'won') : 'lost',
                        settledAt: new Date()
                    }).where(eq(bets.id, bet.id))
                    settledCount++
                }
                continue;
            }

            // Normal Settlement Logic (Live or Finished)
            let betUpdated = false
            const updatedSelections = selections.map(s => {
                if (s.matchId === matchId && s.status === 'pending') {
                    const resolution = isSelectionWinner(s.selectionId, s.marketName || "Match Winner", s.label || "", match, result || {})

                    if (resolution.resolved) {
                        betUpdated = true
                        let newStatus = resolution.isWin ? 'won' : 'lost'
                        if (resolution.isVoid) newStatus = 'void'
                        return { ...s, status: newStatus }
                    }
                }
                return s
            })

            if (!betUpdated) continue

            // Check if entire bet is decided
            const allDecided = updatedSelections.every(s => s.status !== 'pending')
            const stillDecidedWin = updatedSelections.every(s => s.status === 'won' || s.status === 'void')
            const hasLostLeg = updatedSelections.some(s => s.status === 'lost')

            if (hasLostLeg) {
                // Bet is LOST
                await db.update(bets).set({
                    status: 'lost',
                    selections: updatedSelections,
                    settledAt: new Date(),
                    updatedAt: new Date()
                }).where(eq(bets.id, bet.id))
                settledCount++
            } else if (allDecided && stillDecidedWin) {
                // Bet is WON
                let payoutAmount = bet.potentialPayout

                // Payout adjustment (e.g. if some legs were voided during this or previous runs)
                const currentTotalOdds = updatedSelections.reduce((acc, curr) => acc * (curr.status === 'void' ? 1.0 : curr.odds), 1)
                // Note: Bonus logic would need to be re-run here too for accuracy on multi-settle
                // For now, use existing potential payout but adjust for bonus rules

                if (bet.isBonusBet) {
                    payoutAmount = Math.max(0, payoutAmount - bet.stake);
                }

                await db.update(bets).set({
                    status: 'won',
                    selections: updatedSelections,
                    settledAt: new Date(),
                    updatedAt: new Date()
                }).where(eq(bets.id, bet.id))

                const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                if (userWallet.length > 0) {
                    const wallet = userWallet[0]
                    await db.update(wallets).set({
                        balance: sql`${wallets.balance} + ${payoutAmount}`,
                        updatedAt: new Date()
                    }).where(eq(wallets.userId, bet.userId))

                    await db.insert(transactions).values({
                        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: wallet.id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore: wallet.balance,
                        balanceAfter: Number(wallet.balance) + payoutAmount,
                        reference: bet.id,
                        description: `Double Win: ${bet.id}`
                    })
                }
                settledCount++
            } else {
                // Bet is still pending (partial legs won), just update the selections
                await db.update(bets).set({
                    selections: updatedSelections,
                    updatedAt: new Date()
                }).where(eq(bets.id, bet.id))
            }
        }

        // Final Match Status Transition: Finished -> Settled
        // This signifies that all bets for this match have been processed at least once in its finished state.
        if (match.status === 'finished') {
            const { matches } = await import("./db/schema")
            await db.update(matches).set({ status: 'settled' }).where(eq(matches.id, matchId))
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
): { resolved: boolean, isWin: boolean, isVoid?: boolean } {
    const sport = (match.sportType || 'football').toLowerCase()
    const metadata = (result.metadata || {}) as Record<string, any>
    const scores = result.scores || {}
    const participants = match.participants || []

    // 0. MANUAL OVERRIDE (Explicit Outcomes from Admin)
    const outcomes = (metadata.outcomes as Record<string, string>) || {}
    const normalizedMarket = marketName.toLowerCase().trim()

    // Check for exact or normalized match in overrides
    const overrideKey = Object.keys(outcomes).find(k => k.toLowerCase().trim() === normalizedMarket)
    if (overrideKey && outcomes[overrideKey]) {
        if (outcomes[overrideKey] === 'void') {
            return { resolved: true, isWin: false, isVoid: true }
        }
        return { resolved: true, isWin: outcomes[overrideKey] === selectionId }
    }

    // Virtuals Adapter: If it's a virtual match outcome
    const isVirtualOutcome = (result as any).winnerIndex !== undefined && Array.isArray((result as any).totalScores);
    const vOutcome = isVirtualOutcome ? (result as any) : null;

    // Normalize Market Name
    const market = marketName.toLowerCase().trim()

    // 1. MATCH WINNER (1X2 / 12)
    if (market === "match winner" || market === "1x2" || market === "win" || market === "12") {
        const isFinished = match.status === 'finished'
        if (!isFinished) return { resolved: false, isWin: false }

        if (selectionId === "X" || label === "Draw") {
            if (isVirtualOutcome) {
                const vScores = vOutcome.totalScores;
                if (vScores.length === 2) return { resolved: true, isWin: vScores[0] === vScores[1] };
                return { resolved: true, isWin: false };
            }
            const values = Object.values(scores)
            return { resolved: true, isWin: values.length >= 2 && values.every(v => v === values[0]) }
        }

        if (isVirtualOutcome) {
            const winnerName = vOutcome.schools[vOutcome.winnerIndex];
            const normalizedSid = selectionId.startsWith('v-') ? selectionId.substring(2) : selectionId;

            if (selectionId === "1") return { resolved: true, isWin: vOutcome.winnerIndex === 0 };
            if (selectionId === "2") return { resolved: true, isWin: vOutcome.winnerIndex === 1 };
            return { resolved: true, isWin: winnerName === normalizedSid };
        }

        if (result.winner === selectionId) return { resolved: true, isWin: true };

        // Final score check
        if (scores[selectionId] !== undefined) {
            const myScore = scores[selectionId];
            const otherScores = Object.entries(scores).filter(([id]) => id !== selectionId).map(([_, s]) => s);
            return { resolved: true, isWin: otherScores.every(os => myScore > os) };
        }

        return { resolved: true, isWin: false };
    }

    // 2. TOTAL POINTS / GOALS (Over/Under)
    if (market.includes("total") || market.includes("over/under")) {
        const totalScore = isVirtualOutcome
            ? (vOutcome.totalScores as number[]).reduce((a, b) => a + b, 0)
            : Object.values(scores).reduce((a, b) => a + b, 0)

        const parts = label.split(" ")
        const lineStr = parts[parts.length - 1]
        const line = parseFloat(lineStr)

        if (isNaN(line)) return { resolved: false, isWin: false }

        const isOver = label.toLowerCase().includes("over")
        const isUnder = label.toLowerCase().includes("under")

        // If it's already "Over" the line, it's resolved even if match is live
        if (isOver && totalScore > line) return { resolved: true, isWin: true }

        // If match is finished, resolve definitively
        if (match.status === 'finished') {
            return { resolved: true, isWin: isOver ? totalScore > line : totalScore < line }
        }

        // If it's "Under" and we already passed it, it's lost
        if (isUnder && totalScore > line) return { resolved: true, isWin: false }

        return { resolved: false, isWin: false }
    }

    // 3. FIRST HALF WINNER / TOTALS
    if (market.includes("1st half") || market.includes("first half")) {
        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        const isHTDecided = match.status === "HT" || match.status === "2nd Half" || match.status === "finished" || (typeof metadata.period === 'string' && ["HT", "2H", "finished"].includes(metadata.period))

        if (!isHTDecided) return { resolved: false, isWin: false }

        const htScores: Record<string, number> = {}
        Object.entries(footballDetails).forEach(([id, data]) => htScores[id] = data.ht)

        if (market.includes("winner")) {
            if (selectionId === "X" || label === "Draw") {
                const values = Object.values(htScores)
                return { resolved: true, isWin: values.length >= 2 && values.every(v => v === values[0]) }
            }
            const myScore = htScores[selectionId]
            const otherScores = Object.entries(htScores).filter(([id]) => id !== selectionId).map(([_, s]) => s)
            return { resolved: true, isWin: myScore !== undefined && otherScores.every(os => myScore > os) }
        }

        if (market.includes("total") || market.includes("over/under")) {
            const totalHT = Object.values(htScores).reduce((a, b) => a + (b || 0), 0)
            const parts = label.split(" ")
            const line = parseFloat(parts[parts.length - 1])
            if (label.toLowerCase().includes("over")) return { resolved: true, isWin: totalHT > line }
            return { resolved: true, isWin: totalHT < line }
        }
    }

    // 4. QUIZ ROUND WINNER
    if (market.includes("round") && market.includes("winner")) {
        const roundNum = market.match(/\d+/)?.[0]
        if (!roundNum) return { resolved: false, isWin: false }

        const roundKey = `r${roundNum}`
        const quizDetails = (metadata.quizDetails as Record<string, Record<string, number>>) || {}

        // Check if all participants have a non-NaN score for this round
        const participants = match.participants || []
        const roundResolved = participants.every(p => {
            const score = quizDetails[p.schoolId]?.[roundKey]
            return score !== undefined && !isNaN(score)
        })

        if (!roundResolved) return { resolved: false, isWin: false }

        const roundScores: Record<string, number> = {}
        participants.forEach(p => roundScores[p.schoolId] = quizDetails[p.schoolId][roundKey])

        const myScore = roundScores[selectionId]
        const otherScores = Object.entries(roundScores).filter(([id]) => id !== selectionId).map(([_, s]) => s)

        // Handle Draw in rounds? (Usually quiz rounds don't have Draw market, if they do, same logic as match winner)
        if (selectionId === "X" || label === "Draw") {
            return { resolved: true, isWin: Object.values(roundScores).every(v => v === Object.values(roundScores)[0]) }
        }

        return { resolved: true, isWin: myScore !== undefined && otherScores.every(os => myScore > os) }
    }

    // 5. HANDICAP / SPREAD
    if (market.includes("handicap") || market.includes("spread")) {
        if (match.status !== 'finished') return { resolved: false, isWin: false }

        const lineSign = label.includes("+") ? "+" : "-"
        const [targetName, lineValueStr] = label.split(lineSign)
        const line = parseFloat(`${lineSign}${lineValueStr}`)

        const participant = participants.find(p => p.name.trim().toLowerCase() === targetName.trim().toLowerCase() || p.schoolId === selectionId)
        if (!participant) return { resolved: false, isWin: false }

        const targetId = participant.schoolId
        const myScore = scores[targetId] || 0
        const adjustedScore = myScore + line
        const otherScores = Object.entries(scores).filter(([id]) => id !== targetId).map(([_, s]) => s)

        return { resolved: true, isWin: otherScores.every(os => adjustedScore > os) }
    }

    // Default Fallback
    // If the system reaches this point, it means it's an exotic/AI-generated market 
    // that the automated parser doesn't understand AND the admin didn't provide a manual override for.
    // In this scenario, we return resolved: false, which keeps the bet strictly 'pending' 
    // until the admin explicitly resolves it via the Match Result Modal.
    return { resolved: false, isWin: false }
}

export async function settleOutrightBets(tournamentId: string, winnerId: string) {
    try {
        console.log(`Starting settlement for tournament outrights: ${tournamentId}`)

        // 1. Fetch all PENDING bets that contain an outright prediction for this tournament
        const allPendingBets = await db.select().from(bets).where(eq(bets.status, "pending"))
        const pendingBets = allPendingBets.filter(bet => {
            const selections = bet.selections as unknown as Array<{ tournamentId?: string, marketName: string }> | null
            return selections?.some(s => s.tournamentId === tournamentId && (s.marketName === "Tournament Winner" || s.marketName === "Outright Winner"))
        })

        console.log(`Found ${pendingBets.length} pending outright bets to settle`)

        let settledCount = 0

        for (const bet of pendingBets) {
            const selections = bet.selections as unknown as Array<{
                tournamentId?: string,
                selectionId: string,
                odds: number,
                marketName: string,
                status?: string
            }>

            if (bet.status !== "pending") continue;

            const updatedSelections = selections.map(s => {
                if (s.tournamentId === tournamentId && (s.marketName === "Tournament Winner" || s.marketName === "Outright Winner")) {
                    return { ...s, status: s.selectionId === winnerId ? 'won' : 'lost' }
                }
                return s
            })

            // Since outrights are SINGLES (enforced at placement), the bet status is simply the selection status
            const outrightSelection = updatedSelections.find(s => s.tournamentId === tournamentId)
            if (!outrightSelection) continue

            const isWin = outrightSelection.status === 'won'
            const finalStatus = isWin ? 'won' : 'lost'

            if (isWin) {
                const payoutAmount = bet.potentialPayout
                const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)

                if (userWallet.length > 0) {
                    const wallet = userWallet[0]
                    const balanceBefore = parseFloat(wallet.balance.toString())
                    const balanceAfter = balanceBefore + payoutAmount

                    await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                    await db.insert(transactions).values({
                        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: wallet.id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore,
                        balanceAfter,
                        reference: bet.id,
                        description: `Outright Winner Payout: ${bet.id}`
                    })
                }
            }

            await db.update(bets).set({
                status: finalStatus,
                selections: updatedSelections,
                settledAt: new Date()
            }).where(eq(bets.id, bet.id))

            settledCount++
        }

        return { success: true, settledCount }
    } catch (error) {
        console.error("Outright settlement error:", error)
        return { success: false, error: "Failed to settle outright bets" }
    }
}
