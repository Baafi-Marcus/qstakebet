"use server"

import { db } from "@/lib/db"
import { bets, transactions, users, matches, wallets, withdrawalRequests, tournaments, schools } from "@/lib/db/schema"
import { eq, sum, count, desc, sql, and, gte } from "drizzle-orm"
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
        // Profit = Stakes from Lost Bets - Payouts for Won Bets
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
            }))
        }

    } catch (error) {
        console.error("Failed to fetch admin analytics:", error)
        return { success: false, error: "Internal server error" }
    }
}
