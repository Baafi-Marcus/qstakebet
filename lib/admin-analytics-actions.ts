"use server"

import { db } from "@/lib/db"
import { bets, transactions, users, matches, wallets, withdrawalRequests, tournaments, schools, schoolStrengths } from "@/lib/db/schema"
import { eq, sum, count, desc, sql, and, gte, or } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function getAdminAnalytics() {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Betting Volume & Payouts (All time)
        const bettingStats = await db.select({
            totalStake: sum(bets.stake),
            totalPotentialPayout: sum(bets.potentialPayout),
            betCount: count()
        }).from(bets)

        // 2. Revenue/Profit Calculation
        const wonBetsStats = await db.select({
            payout: sum(bets.potentialPayout)
        }).from(bets).where(eq(bets.status, "won"))

        const lostBetsStats = await db.select({
            stake: sum(bets.stake)
        }).from(bets).where(eq(bets.status, "lost"))

        const totalStaked = Number(bettingStats[0]?.totalStake || 0)
        const totalPayout = Number(wonBetsStats[0]?.payout || 0)
        const platformProfit = Number(lostBetsStats[0]?.stake || 0) - totalPayout

        // 3. User Stats
        const userStats = await db.select({ count: count() }).from(users)

        const matchStats = await db.select({
            status: matches.status,
            count: count()
        }).from(matches).groupBy(matches.status)

        // 4b. Tournament & School counts
        const tournamentCount = await db.select({ count: count() }).from(tournaments)
        const schoolCount = await db.select({ count: count() }).from(schools)

        // 5. Recent 24h Activity
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const last24hVolume = await db.select({
            volume: sum(bets.stake)
        }).from(bets).where(gte(bets.createdAt, dayAgo))

        // 6. Pending Withdrawals
        const pendingWithdrawals = await db.select({ count: count() })
            .from(withdrawalRequests)
            .where(eq(withdrawalRequests.status, "pending"))

        return {
            success: true,
            summary: {
                totalVolume: totalStaked,
                totalPayout: totalPayout,
                estimatedProfit: platformProfit,
                totalUsers: Number(userStats[0]?.count || 0),
                totalTournaments: Number(tournamentCount[0]?.count || 0),
                totalSchools: Number(schoolCount[0]?.count || 0),
                totalBets: Number(bettingStats[0]?.betCount || 0),
                last24hVolume: Number(last24hVolume[0]?.volume || 0),
                payoutRatio: totalStaked > 0 ? (totalPayout / totalStaked) * 100 : 0,
                pendingWithdrawals: Number(pendingWithdrawals[0]?.count || 0)
            },
            matchBreakdown: matchStats.map(s => ({
                status: s.status,
                count: Number(s.count || 0)
            })),
            probabilityData: [
                { category: "Low Risk", range: "1.0 - 2.0", expected: 75, actual: 72, color: "bg-emerald-500" },
                { category: "Medium", range: "2.1 - 5.0", expected: 35, actual: 38, color: "bg-blue-500" },
                { category: "High Risk", range: "5.1+", expected: 12, actual: 9, color: "bg-purple-500" },
            ]
        }

    } catch (error) {
        console.error("Failed to fetch admin analytics:", error)
        return { success: false, error: "Internal server error" }
    }
}

export async function getLiabilityAnalytics() {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Fetch all pending bets
        const pendingBets = await db.select().from(bets).where(eq(bets.status, "pending"))

        // 2. Fetch matches involved in those bets (upcoming & live)
        const activeMatches = await db.select({
            id: matches.id,
            participants: matches.participants,
            status: matches.status,
            sportType: matches.sportType
        }).from(matches).where(or(eq(matches.status, "upcoming"), eq(matches.status, "live")))

        // 3. Map to store liability per match
        const exposureMap: Record<string, {
            matchId: string;
            matchName: string;
            status: string;
            sportType: string;
            totalStaked: number;
            outcomes: Record<string, { selectionName: string; totalStake: number; potentialPayout: number }>;
            maxLiability: number;
        }> = {}

        // Initialize map with active matches
        activeMatches.forEach(m => {
            const p = m.participants as any[]
            const matchName = p ? `${p[0]?.name} vs ${p[1]?.name}` : "Unknown Match"

            exposureMap[m.id] = {
                matchId: m.id,
                matchName,
                status: m.status,
                sportType: m.sportType,
                totalStaked: 0,
                outcomes: {},
                maxLiability: 0
            }
        })

        let largeBetsCount = 0
        const LARGE_BET_THRESHOLD = 500

        // Process bets to calculate liability
        pendingBets.forEach(bet => {
            if (bet.stake >= LARGE_BET_THRESHOLD) largeBetsCount++

            const selections = bet.selections as any[]
            selections.forEach(sel => {
                const matchId = sel.matchId
                if (exposureMap[matchId]) {
                    const outcomeKey = sel.selectionId || sel.id
                    if (!exposureMap[matchId].outcomes[outcomeKey]) {
                        exposureMap[matchId].outcomes[outcomeKey] = {
                            selectionName: sel.name || sel.selectionName,
                            totalStake: 0,
                            potentialPayout: 0
                        }
                    }

                    const stake = bet.mode === 'single' ? bet.stake : (bet.stake / selections.length) // Simplification for multis
                    exposureMap[matchId].totalStaked += stake
                    exposureMap[matchId].outcomes[outcomeKey].totalStake += stake

                    // Payout is tricky for multis. For this dashboard, we show "Potential Payout if this leg wins"
                    // which is (Total Bet Payout) but that overstates risk if other legs lose.
                    // Better to show the specific leg's contribution to risk.
                    const payout = bet.mode === 'single' ? bet.potentialPayout : (bet.potentialPayout / selections.length)
                    exposureMap[matchId].outcomes[outcomeKey].potentialPayout += payout
                }
            })
        })

        // Calculate max liability (worst case scenario) for each match
        const finalExposure = Object.values(exposureMap).map(match => {
            let maxRisk = 0
            Object.values(match.outcomes).forEach(outcome => {
                if (outcome.potentialPayout > maxRisk) maxRisk = outcome.potentialPayout
            })
            return {
                ...match,
                maxLiability: maxRisk
            }
        }).filter(m => m.totalStaked > 0) // Only show matches with bets

        return {
            success: true,
            exposure: finalExposure.sort((a, b) => b.maxLiability - a.maxLiability),
            stats: {
                totalPendingVolume: pendingBets.reduce((acc, b) => acc + b.stake, 0),
                largeBetsCount
            }
        }

    } catch (error) {
        console.error("Failed to fetch liability analytics:", error)
        return { success: false, error: "Internal server error" }
    }
}

export async function getVirtualHealthAnalytics() {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Fetch finished virtual matches
        const virtualMatches = await db.select().from(matches)
            .where(and(eq(matches.isVirtual, true), eq(matches.status, "finished")))
            .orderBy(desc(matches.createdAt))
            .limit(100)

        // 2. Fetch school ratings (strengths)
        const ratingsList = await db.select().from(schoolStrengths)

        // 3. Analytics: School Performance
        const schoolPerformance: Record<string, { wins: number; matches: number; avgRating: number }> = {}

        virtualMatches.forEach(m => {
            const result = m.result as any
            const winnerId = result?.winner

            const participants = m.participants as any[]
            participants.forEach(p => {
                const schoolId = p.schoolId.replace('v-', '') // Remove virtual prefix if present
                if (!schoolPerformance[schoolId]) {
                    const ratingObj = ratingsList.find(r => r.schoolId === schoolId)
                    schoolPerformance[schoolId] = {
                        wins: 0,
                        matches: 0,
                        avgRating: (ratingObj?.rating as any)?.overall || 50
                    }
                }
                schoolPerformance[schoolId].matches++
                if (p.schoolId === winnerId || p.name === winnerId) {
                    schoolPerformance[schoolId].wins++
                }
            })
        })

        // 4. Financial: Virtual RTP
        const virtualBets = await db.select({
            stake: sum(bets.stake),
            payout: sum(bets.potentialPayout),
            status: bets.status
        })
            .from(bets)
            .leftJoin(matches, sql`${bets.selections}->0->>'matchId' = ${matches.id}`)
            .where(eq(matches.isVirtual, true))
            .groupBy(bets.status)

        let totalStaked = 0
        let totalPaidOut = 0

        virtualBets.forEach(group => {
            totalStaked += Number(group.stake || 0)
            if (group.status === 'won') {
                totalPaidOut += Number(group.payout || 0)
            }
        })

        const rtp = totalStaked > 0 ? (totalPaidOut / totalStaked) * 100 : 0

        return {
            success: true,
            schoolStats: Object.entries(schoolPerformance)
                .map(([name, stats]) => ({
                    name,
                    ...stats,
                    winRate: (stats.wins / stats.matches) * 100
                }))
                .sort((a, b) => b.winRate - a.winRate),
            financials: {
                totalStaked,
                totalPaidOut,
                rtp
            }
        }
    } catch (error) {
        console.error("Failed to fetch virtual health analytics:", error)
        return { success: false, error: "Internal server error" }
    }
}

export async function getAllBets() {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const allBets = await db.select({
            id: bets.id,
            userName: users.name,
            userEmail: users.email,
            stake: bets.stake,
            totalOdds: bets.totalOdds,
            potentialPayout: bets.potentialPayout,
            status: bets.status,
            mode: bets.mode,
            createdAt: bets.createdAt,
            selections: bets.selections
        })
            .from(bets)
            .leftJoin(users, eq(bets.userId, users.id))
            .orderBy(desc(bets.createdAt))
            .limit(100)

        return { success: true, bets: allBets }
    } catch (error) {
        console.error("Failed to fetch all bets:", error)
        return { success: false, error: "Internal server error" }
    }
}
