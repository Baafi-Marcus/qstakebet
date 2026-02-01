import { db } from "@/lib/db"
import { bets, matches, wallets, transactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

        if (!result?.winner) {
            console.error("Match has no winner declared")
            return { success: false, error: "Match has no winner" }
        }

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
                label?: string
            }>

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

            const isWin = isSelectionWinner(selectionId, marketName || "Match Winner", label || "", match, result)

            let newStatus = isWin ? "won" : "lost"

            // If it's a multi-bet and this leg WON, we don't necessarily mark the WHOLE bet as won yet.
            // But if this leg LOST, the whole bet is LOST.
            if (selections.length > 1) {
                if (!isWin) {
                    newStatus = "lost" // One leg lost = Multi lost
                } else {
                    // If won, we need to check if all other legs are settled. 
                    // For now, we SKIP marking it "won" if it's a multi, unless we verify all legs.
                    // Simplified: Only mark LOST multis. Leave WON multis for a full-sweep job.
                    continue
                }
            }

            const payoutAmount = (newStatus === "won") ? bet.potentialPayout : 0

            // Update Bet Status
            await db.update(bets)
                .set({
                    status: newStatus,
                    settledAt: new Date()
                })
                .where(eq(bets.id, bet.id))

            // Credit Wallet if Won
            if (newStatus === "won" && payoutAmount > 0) {
                const userWallet = await db.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                if (userWallet.length > 0) {
                    const balanceBefore = parseFloat(userWallet[0].balance.toString())
                    const balanceAfter = balanceBefore + payoutAmount

                    await db.update(wallets).set({ balance: balanceAfter }).where(eq(wallets.userId, bet.userId))

                    await db.insert(transactions).values({
                        id: `txn-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: userWallet[0].id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore,
                        balanceAfter,
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
function isSelectionWinner(
    selectionId: string,
    marketName: string,
    label: string,
    match: Match,
    result: { winner?: string, scores?: Record<string, number>, metadata?: Record<string, unknown> }
): boolean {
    const sport = match.sportType || 'football'
    const metadata = result.metadata || {}
    const scores = result.scores || {}
    const teamIds = Object.keys(scores)

    // Normalize Market Name
    const market = marketName.toLowerCase().trim()

    // 1. MATCH WINNER (1X2)
    if (market === "match winner" || market === "1x2") {
        if (selectionId === "X") {
            // Check for Draw
            if (sport === 'football' || sport === 'handball') {
                // Return true if scores are equal
                const values = Object.values(scores)
                return values.length === 2 && values[0] === values[1]
            }
            return false
        }
        return result.winner === selectionId
    }

    // 2. TOTAL POINTS / GOALS (Over/Under)
    // Label format: "Over 2.5", "Under 140.5"
    if (market.includes("total") || market.includes("over/under")) {
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
        const [type, lineStr] = label.split(" ")
        const line = parseFloat(lineStr)

        if (isNaN(line)) return false

        if (type.toLowerCase() === "over") return totalScore > line
        if (type.toLowerCase() === "under") return totalScore < line
    }

    // 3. WINNING MARGIN
    // Label format: "1-10", "11-20", "Draw"
    if (market.includes("margin")) {
        const values = Object.values(scores)
        if (values.length < 2) return false
        const diff = Math.abs(values[0] - values[1])

        if (label === "Draw" || label === "0") return diff === 0

        // Parse range "1-10"
        if (label.includes("-")) {
            const [min, max] = label.split("-").map(Number)
            return diff >= min && diff <= max
        }
        // Parse "10+"
        if (label.includes("+")) {
            const min = parseFloat(label)
            return diff >= min
        }
    }

    // 4. BOTH TEAMS TO SCORE (BTTS)
    if (market === "btts" || market === "both teams to score") {
        const values = Object.values(scores)
        const bothScored = values.length === 2 && values.every(s => s > 0)
        return (label.toLowerCase() === "yes" && bothScored) || (label.toLowerCase() === "no" && !bothScored)
    }

    // 5. QUIZ SPECIFIC: Round Winners
    // Market: "Round 1 Winner", "Round 2 Winner"
    if (market.includes("round") && market.includes("winner")) {
        // Extract Round Number
        const roundNum = market.match(/\d+/)?.[0] // "1" from "Round 1 Winner"
        if (!roundNum) return false

        const roundKey = `r${roundNum}` // "r1"
        const roundScores = (metadata.quizDetails as Record<string, Record<string, number>>)?.[roundKey] || {} // { schoolId: 10, schoolId2: 5 }

        // Find max score in this round
        let maxScore = -999
        let winner = ""
        Object.entries(roundScores).forEach(([id, score]) => {
            if ((score as number) > maxScore) {
                maxScore = score as number
                winner = id
            }
        })

        return winner === selectionId
    }

    // 6. QUIZ: Highest Scoring Round
    if (market === "highest scoring round") {
        // label might be "Round 1"
        const targetRound = label.replace("Round ", "r") // "r1"

        let bestRound = ""
        let maxTotal = -1

        // Calculate total score for each round r1..r5
        for (let i = 1; i <= 5; i++) {
            const rKey = `r${i}`
            const rScores = (metadata.quizDetails as Record<string, Record<string, number>>)?.[rKey] || {}
            const total = Object.values(rScores).reduce((a: number, b: number) => a + b, 0)

            if (total > maxTotal) {
                maxTotal = total
                bestRound = rKey
            }
        }

        return targetRound === bestRound
    }

    // 7. GENERIC PROPS (Manual Tags)
    // If the market name exists in metadata as a boolean key
    // e.g. Market "Sudden Death" -> metadata.suddenDeath = true
    const cleanKey = market.replace(/\s+/g, "")
    if (metadata[cleanKey] !== undefined) {
        return metadata[cleanKey] === true && label === "Yes"
    }

    // Default Fallback: Assume simple winner match
    return result.winner === selectionId
}
