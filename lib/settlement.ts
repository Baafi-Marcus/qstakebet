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
                            const payout = newPayout
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
                const payoutAmount = bet.potentialPayout

                // Payout adjustment (e.g. if some legs were voided during this or previous runs)
                const currentTotalOdds = updatedSelections.reduce((acc, curr) => acc * (curr.status === 'void' ? 1.0 : curr.odds), 1)
                // Note: Bonus logic would need to be re-run here too for accuracy on multi-settle
                // For now, use existing potential payout but adjust for bonus rules

                // For now, use existing potential payout but adjust for bonus rules

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
        // We refetch the status to ensure we are seeing the latest update from the admin action
        const finalCheck = await db.select({ status: matches.status }).from(matches).where(eq(matches.id, matchId)).limit(1)
        if (finalCheck.length > 0 && (finalCheck[0].status === 'finished' || finalCheck[0].status === 'locked' || finalCheck[0].status === 'live')) {
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

    // Normalize Market Name for robust matching
    const market = marketName.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
    const isMatchWinner = market === "matchwinner" || market === "1x2" || market === "win" || market === "12"
    const isTotal = market.includes("total") || market.includes("overunder")
    const isHT = market.includes("1sthalf") || market.includes("firsthalf") || market.includes("htft") || market.includes("halftimefulltime")
    const isBTTS = market.includes("btts") || market.includes("bothteamstoscore")
    const isHandicap = market.includes("handicap") || market.includes("spread")
    const isDoubleChance = market.includes("doublechance")
    const isDNB = market.includes("drawnobet") || market.includes("dnb")
    const isWinningMargin = market.includes("winningmargin")
    const isFirstGoal = market.includes("firstteamtoscore") || market.includes("firstgoal") || market.includes("teamtoscorefirst")
    const isOddEven = market.includes("oddeven")

    // 1. MATCH WINNER (1X2 / 12)
    if (isMatchWinner) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
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
    if (isTotal) {
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
    if (isHT) {
        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        const hasHTScores = Object.values(footballDetails).some(d => d.ht !== undefined)
        const isHTDecided = hasHTScores || match.status === "HT" || match.status === "2nd Half" || match.status === "finished" || (typeof metadata.period === 'string' && ["HT", "2H", "finished"].includes(metadata.period))

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

        if (market.includes("total") || market.includes("overunder") || market.includes("goals")) {
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
    if (isHandicap) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

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

    // 6. BTTS (Both Teams to Score)
    if (isBTTS) {
        if (match.status !== 'finished' && !Object.values(scores).every(s => s > 0)) return { resolved: false, isWin: false }

        const bothScored = Object.values(scores).length >= 2 && Object.values(scores).every(s => s > 0)
        if (selectionId === "Yes" || label.toLowerCase() === "yes") return { resolved: true, isWin: bothScored }
        if (selectionId === "No" || label.toLowerCase() === "no") return { resolved: true, isWin: !bothScored }
    }

    // 7. DOUBLE CHANCE
    if (isDoubleChance) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const homeId = participants[0]?.schoolId
        const awayId = participants[1]?.schoolId
        const winner = result.winner

        if (selectionId === "1X" || label === "1X") return { resolved: true, isWin: winner === homeId || winner === 'X' }
        if (selectionId === "12" || label === "12") return { resolved: true, isWin: winner === homeId || winner === awayId }
        if (selectionId === "X2" || label === "X2") return { resolved: true, isWin: winner === awayId || winner === 'X' }
    }

    // 8. DRAW NO BET
    if (isDNB) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        if (result.winner === 'X') return { resolved: true, isWin: false, isVoid: true }
        return { resolved: true, isWin: result.winner === selectionId }
    }

    // 9. HT/FT (Half Time / Full Time)
    if (market === "htft" || market === "halftimefulltime") {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        if (Object.keys(footballDetails).length < 2) return { resolved: false, isWin: false }

        const p1 = participants[0]?.schoolId
        const p2 = participants[1]?.schoolId

        const h1 = footballDetails[p1]?.ht || 0
        const a1 = footballDetails[p2]?.ht || 0
        const htRes = h1 > a1 ? '1' : (a1 > h1 ? '2' : 'X')

        const h2 = footballDetails[p1]?.ft || 0
        const a2 = footballDetails[p2]?.ft || 0
        const ftRes = h2 > a2 ? '1' : (a2 > h2 ? '2' : 'X')

        const combinedResult = `${htRes}/${ftRes}` // e.g. "X/1", "1/1"
        return { resolved: true, isWin: selectionId === combinedResult || label === combinedResult }
    }

    // 10. FIRST HALF WINNER
    if (market.includes("firsthalfwinner") || market.includes("1sthalfwinner")) {
        const footballDetails = (metadata.footballDetails as Record<string, { ht: number, ft: number }>) || {}
        if (Object.keys(footballDetails).length < 2) return { resolved: false, isWin: false }

        const p1 = participants[0]?.schoolId
        const p2 = participants[1]?.schoolId
        const h1 = footballDetails[p1]?.ht || 0
        const a1 = footballDetails[p2]?.ht || 0
        const htRes = h1 > a1 ? '1' : (a1 > h1 ? '2' : 'X')

        if (selectionId === 'X' || label.toLowerCase() === 'draw') return { resolved: true, isWin: htRes === 'X' }
        return { resolved: true, isWin: selectionId === (htRes === '1' ? p1 : (htRes === '2' ? p2 : '')) }
    }

    // 10. WINNING MARGIN
    if (isWinningMargin) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }

        const values = Object.values(scores)
        if (values.length < 2) return { resolved: false, isWin: false }

        const p1 = participants[0]?.schoolId
        const p2 = participants[1]?.schoolId
        const s1 = scores[p1] || 0
        const s2 = scores[p2] || 0

        const diff = Math.abs(s1 - s2)
        const victor = s1 > s2 ? '1' : (s2 > s1 ? '2' : 'X')

        if (victor === 'X') {
            return { resolved: true, isWin: selectionId === 'Draw' || label.toLowerCase() === 'draw' }
        }

        // e.g. "Home by 1", "Away by 2+"
        const isHome = victor === '1'
        const labelLower = label.toLowerCase()

        if (isHome && labelLower.includes('home by')) {
            if (labelLower.includes('+') && diff >= parseInt(labelLower.match(/\d+/)?.[0] || "0")) return { resolved: true, isWin: true }
            return { resolved: true, isWin: diff === parseInt(labelLower.match(/\d+/)?.[0] || "0") }
        }
        if (!isHome && labelLower.includes('away by')) {
            if (labelLower.includes('+') && diff >= parseInt(labelLower.match(/\d+/)?.[0] || "0")) return { resolved: true, isWin: true }
            return { resolved: true, isWin: diff === parseInt(labelLower.match(/\d+/)?.[0] || "0") }
        }

        return { resolved: true, isWin: false }
    }

    // 11. FIRST TEAM TO SCORE
    if (isFirstGoal) {
        const firstScorerId = metadata.firstScorerId // We'll add this to the admin UI
        if (!firstScorerId && match.status !== 'finished') return { resolved: false, isWin: false }

        // If match finished 0-0
        const totalGoals = Object.values(scores).reduce((a, b) => a + b, 0)
        if (match.status === 'finished' && totalGoals === 0) {
            return { resolved: true, isWin: selectionId === 'none' || label.toLowerCase().includes('no goal') }
        }

        if (firstScorerId) {
            return { resolved: true, isWin: selectionId === firstScorerId }
        }

        return { resolved: false, isWin: false }
    }

    // 12. ODD/EVEN TOTAL GOALS
    if (isOddEven) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }
        const totalGoals = Object.values(scores).reduce((a, b) => a + b, 0)
        const isOdd = totalGoals % 2 !== 0
        if (selectionId.toLowerCase() === 'odd' || label.toLowerCase() === 'odd') return { resolved: true, isWin: isOdd }
        if (selectionId.toLowerCase() === 'even' || label.toLowerCase() === 'even') return { resolved: true, isWin: !isOdd }
    }

    // 13. TOTAL POINTS (Interchangeable with Goals)
    if (market.includes("totalpoints") || market.includes("totalpoint")) {
        const isFinished = match.status === 'finished' || (result?.winner && result.winner !== 'pending')
        if (!isFinished) return { resolved: false, isWin: false }
        const totalPoints = Object.values(scores).reduce((a, b) => a + b, 0)
        const target = parseFloat(label.match(/[\d.]+/)?.[0] || "0")
        if (label.toLowerCase().includes("over")) return { resolved: true, isWin: totalPoints > target }
        if (label.toLowerCase().includes("under")) return { resolved: true, isWin: totalPoints < target }
    }

    // Default Fallback
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
