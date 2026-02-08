"use server"

import { db } from "@/lib/db"
import { virtualSchoolStats, schools, schoolStrengths } from "@/lib/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { VirtualMatchOutcome } from "@/lib/virtuals"
import { VirtualSchool } from "@/lib/virtuals" // Ensure type is imported

// ... existing code ...

export async function getPlayableSchools(): Promise<VirtualSchool[]> {
    try {
        // Fetch all schools from the DB
        // If DB is empty, this returns empty. 
        // In a real app we might seed it.
        const allSchools = await db.select({
            name: schools.name,
            region: schools.region
        }).from(schools);

        if (allSchools.length > 0) {
            return allSchools;
        }

        // Fallback if DB empty
        return [];
    } catch (e) {
        console.error("Failed to fetch real schools:", e);
        return [];
    }
}

// AI Learning Rate
const LEARNING_RATE = 0.05;
const VOLATILITY_DECAY = 0.98;

export async function updateSchoolStats(results: VirtualMatchOutcome[]) {
    try {
        for (const match of results) {
            const winnerName = match.schools[match.winnerIndex];

            // We need to resolve school names to IDs. 
            // For now, assuming names are unique or mapped. 
            // In a real scenario, we'd pass IDs.
            // Fetching School IDs based on names (Optimized in real app)
            const schoolRecords = await db.select().from(schools).where(inArray(schools.name, match.schools));

            for (const school of schoolRecords) {
                // Find existing stats or create
                const existingStats = await db.select().from(virtualSchoolStats)
                    .where(eq(virtualSchoolStats.schoolId, school.id))
                    .limit(1);

                let stats = existingStats[0];

                if (!stats) {
                    // Initialize
                    const newId = `vss-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    [stats] = await db.insert(virtualSchoolStats).values({
                        id: newId,
                        schoolId: school.id,
                        matchesPlayed: 0,
                        wins: 0,
                        currentForm: 1.0,
                        volatilityIndex: 0.1
                    }).returning();
                }

                // AI LOGIC: Update Form
                const isWinner = school.name === winnerName;
                const performanceDelta = isWinner ? LEARNING_RATE : - (LEARNING_RATE / 2);

                // Form Clamping (0.5 to 2.0)
                let newForm = (stats.currentForm || 1.0) + performanceDelta;
                newForm = Math.max(0.5, Math.min(2.0, newForm));

                // Volatility Update (Increase if upset)
                // Simplified: If winner had low form, increase volatility for everyone in match?
                // Just decay volatility for stability over time
                const newVolatility = (stats.volatilityIndex || 0.1) * VOLATILITY_DECAY;

                await db.update(virtualSchoolStats).set({
                    matchesPlayed: (stats.matchesPlayed || 0) + 1,
                    wins: (stats.wins || 0) + (isWinner ? 1 : 0),
                    currentForm: newForm,
                    volatilityIndex: newVolatility,
                    lastUpdated: new Date()
                }).where(eq(virtualSchoolStats.id, stats.id));
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to update AI stats:", error);
        return { success: false, error: "Failed to learn from matches" };
    }
}

export async function getAIStrengths(schoolNames: string[]) {
    // If table is empty or schools not found, return defaults/randoms
    // This allows the simulation to fall back to random if "AI" hasn't learned yet.
    try {
        const schoolRecords = await db.select({
            name: schools.name,
            form: virtualSchoolStats.currentForm,
            volatility: virtualSchoolStats.volatilityIndex
        })
            .from(schools)
            .leftJoin(virtualSchoolStats, eq(schools.id, virtualSchoolStats.schoolId))
            .where(inArray(schools.name, schoolNames));

        return schoolRecords;
    } catch (error) {
        return [];
    }
}
export async function settleVirtualBet(betId: string, roundId: number, userSeed: number) {
    try {
        const { auth } = await import("@/lib/auth")
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" }
        }

        const { bets, wallets, transactions } = await import("@/lib/db/schema")
        const { sql } = await import("drizzle-orm")
        const { generateVirtualMatches } = await import("@/lib/virtuals")
        const { isSelectionWinner } = await import("@/lib/settlement")

        // 1. Fetch Bet
        const betData = await db.select().from(bets).where(eq(bets.id, betId)).limit(1)
        if (betData.length === 0) return { success: false, error: "Bet not found" }

        const bet = betData[0]
        if (bet.status !== 'pending') return { success: true, message: "Already settled" }
        if (bet.userId !== session.user.id) return { success: false, error: "Forbidden" }

        // 2. Regenerate Outcomes
        // We need to determine category and region from the selections
        let category: 'national' | 'regional' = 'national'
        let queryRegion: string | undefined = undefined
        const selections = bet.selections as any[]
        const firstSelection = selections[0]
        if (firstSelection?.matchId.startsWith('vmt-')) {
            const parts = firstSelection.matchId.split('-')
            category = (parts[3] as 'national' | 'regional') || 'national'
            const regionSlug = parts[4]
            if (regionSlug && regionSlug !== 'all') {
                // Approximate region name from slug or just use it if allowed
                const schoolsData = await import("@/lib/virtuals").then(m => m.DEFAULT_SCHOOLS)
                const schoolsInThisRegion = schoolsData.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regionSlug);
                queryRegion = schoolsInThisRegion?.region;
            }
        }

        const { outcomes } = generateVirtualMatches(15, [], roundId, category, queryRegion, {}, userSeed)

        const MAX_GAME_PAYOUT = 3000
        const isMulti = bet.status === 'pending' && selections.length > 1 && !bet.id.includes('single') // Simplified mode check or use potential payout logic

        // We need to know if it was 'single' or 'multi' mode. 
        // In VirtualsClient we use betMode. If we didn't save it in DB, we can infer from payout logic.
        // Actually, let's assume if potentialPayout == stake * totalOdds (ignoring bonus) it's multi.
        // But since we updated placeBet to take 'mode', let's check if we can add 'mode' to the bets table?
        // For now, we can check if it's a multi based on selections length and potential payout.
        const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1)
        const inferredMulti = Math.abs(bet.potentialPayout - (bet.stake * totalOdds)) < 0.01

        let isWon = false
        let totalReturns = 0

        if (!inferredMulti && selections.length > 1) {
            // SINGLE Mode logic
            const stakePerSelection = bet.stake / selections.length
            const gameReturns: Record<string, number> = {}

            selections.forEach(s => {
                const outcome = outcomes.find(o => o.id === s.matchId) as any
                if (outcome) {
                    const match = { sportType: 'football', participants: [] } as any // Dummy for helper
                    const winner = isSelectionWinner(s.selectionId, s.marketName, s.label, match, outcome)
                    if (winner) {
                        const amount = s.odds * stakePerSelection
                        gameReturns[s.matchId] = (gameReturns[s.matchId] || 0) + amount
                    }
                }
            })

            // Aggregate Payout Cap (per match)
            Object.keys(gameReturns).forEach(matchId => {
                if (gameReturns[matchId] > MAX_GAME_PAYOUT) gameReturns[matchId] = MAX_GAME_PAYOUT
            })

            totalReturns = Object.values(gameReturns).reduce((a, b) => a + b, 0)
            isWon = totalReturns > 0
        } else {
            // MULTI Mode logic (or 1 selection)
            let allWon = true
            selections.forEach(s => {
                const outcome = outcomes.find(o => o.id === s.matchId) as any
                if (!outcome) {
                    allWon = false
                    return
                }
                const match = { sportType: 'football', participants: [] } as any
                const winner = isSelectionWinner(s.selectionId, s.marketName, s.label, match, outcome)
                if (!winner) allWon = false
            })

            if (allWon) {
                totalReturns = bet.potentialPayout
            }
            isWon = allWon && totalReturns > 0
        }

        // 4. Update Database
        const finalStatus = isWon ? 'won' : 'lost'
        let payoutAmount = isWon ? totalReturns : 0

        // GIFT RULE: Deduct stake from winnings
        if (isWon && bet.isBonusBet) {
            payoutAmount = Math.max(0, payoutAmount - bet.stake)
        }

        return await db.transaction(async (tx) => {
            await tx.update(bets).set({
                status: finalStatus,
                settledAt: new Date(),
                updatedAt: new Date()
            }).where(eq(bets.id, betId))

            if (isWon && payoutAmount > 0) {
                const walletData = await tx.select().from(wallets).where(eq(wallets.userId, bet.userId)).limit(1)
                if (walletData.length > 0) {
                    const wallet = walletData[0]
                    const isBonusWin = bet.isBonusBet

                    await tx.update(wallets).set({
                        balance: isBonusWin ? wallet.balance : sql`${wallets.balance} + ${payoutAmount}`,
                        lockedBalance: isBonusWin ? sql`${wallets.lockedBalance} + ${payoutAmount}` : wallet.lockedBalance,
                        updatedAt: new Date()
                    }).where(eq(wallets.userId, bet.userId))

                    await tx.insert(transactions).values({
                        id: `txn-v-${Math.random().toString(36).substr(2, 9)}`,
                        userId: bet.userId,
                        walletId: wallet.id,
                        amount: payoutAmount,
                        type: "bet_payout",
                        balanceBefore: isBonusWin ? wallet.lockedBalance : wallet.balance,
                        balanceAfter: isBonusWin ? Number(wallet.lockedBalance) + payoutAmount : Number(wallet.balance) + payoutAmount,
                        reference: bet.id,
                        description: `Virtual Winnings: ${betId}`
                    })
                }
            }
            return { success: true, status: finalStatus, payout: payoutAmount }
        })

    } catch (error) {
        console.error("Virtual settlement error:", error)
        return { success: false, error: "Failed to settle virtual bet" }
    }
}
