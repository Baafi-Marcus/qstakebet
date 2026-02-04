
import { db } from "./db"
import { matches } from "./db/schema"
import { eq } from "drizzle-orm"
import { Match } from "./types"

/**
 * Recalculates odds for a match based on current betting volume.
 * 
 * Algorithm:
 * 1. Load match and its bet volume
 * 2. Calculate total stake across all selections in a market
 * 3. Adjust odds to shift liability away from popular selections
 * 4. Maintain the house margin (default 10%)
 */
export async function recalculateOdds(matchId: string) {
    try {
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData.length) return { success: false, error: "Match not found" }

        const match = matchData[0] as unknown as Match
        // We use any to access the newly added fields since types might not be updated yet
        const m = matchData[0] as any

        const betVolume = m.betVolume || {}
        const baseOdds = m.baseOdds || match.odds || {}
        const margin = m.margin || 0.1 // 10%

        // Only adjust Match Winner for now as it's the most high-volume
        const currentOdds = { ...match.odds }
        const marketSelections = Object.keys(currentOdds)

        let totalStake = 0
        marketSelections.forEach(sid => {
            totalStake += betVolume[sid]?.totalStake || 0
        })

        if (totalStake === 0) return { success: true, message: "No bets yet, keeping base odds" }

        // 1. Calculate implied probabilities from stake distribution
        const stakeProbabilities: Record<string, number> = {}
        marketSelections.forEach(sid => {
            const stake = betVolume[sid]?.totalStake || 0
            stakeProbabilities[sid] = stake / totalStake
        })

        // 2. Adjust base probabilities with stake distribution (liability shift)
        // New prob = (0.7 * OriginalProb) + (0.3 * StakeProb)
        // This balances between theoretical likelihood and actual market demand
        const newOdds: Record<string, number> = {}
        let totalAdjustedProb = 0

        marketSelections.forEach(sid => {
            const originalOdd = baseOdds[sid] || 2.0
            const originalProb = 1 / originalOdd
            const stakeProb = stakeProbabilities[sid] || 0

            // Weight: 70% original, 30% market volume
            const adjustedProb = (originalProb * 0.7) + (stakeProb * 0.3)
            newOdds[sid] = adjustedProb
            totalAdjustedProb += adjustedProb
        })

        // 3. Normalize and add margin
        // Target Sum = 1 + Margin (e.g. 1.10 for 10% margin)
        const targetSum = 1 + margin
        const finalOdds: Record<string, number> = {}

        marketSelections.forEach(sid => {
            // Normalize prob so they sum to 1, then multiply by targetSum
            const normalizedProb = (newOdds[sid] / totalAdjustedProb) * targetSum
            // Odd = 1 / Probability
            const finalOdd = 1 / normalizedProb

            // Limit odds shift (don't let it drop below 1.05 or rise too high)
            finalOdds[sid] = Math.max(1.05, Math.min(100, Math.round(finalOdd * 100) / 100))
        })

        // 4. Update database
        await db.update(matches)
            .set({
                odds: finalOdds,
                lastRecalculatedAt: new Date()
            })
            .where(eq(matches.id, matchId))

        return { success: true, newOdds: finalOdds }
    } catch (error) {
        console.error("Failed to recalculate odds:", error)
        return { success: false, error: "Odds engine failure" }
    }
}

/**
 * Updates bet volume for a match selection
 */
export async function recordBetStake(matchId: string, selectionId: string, stake: number) {
    try {
        const matchData = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!matchData.length) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = matchData[0] as any
        const betVolume = m.betVolume || {}

        if (!betVolume[selectionId]) {
            betVolume[selectionId] = { totalStake: 0, betCount: 0, lastUpdated: new Date().toISOString() }
        }

        betVolume[selectionId].totalStake += stake
        betVolume[selectionId].betCount += 1
        betVolume[selectionId].lastUpdated = new Date().toISOString()

        await db.update(matches)
            .set({ betVolume })
            .where(eq(matches.id, matchId))

        // Recalculate odds after updating volume
        await recalculateOdds(matchId)
    } catch (error) {
        console.error("Failed to record bet stake:", error)
    }
}
