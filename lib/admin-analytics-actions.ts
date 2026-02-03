"use server"

import { db } from "@/lib/db"
import { bets, transactions, users, matches, wallets } from "@/lib/db/schema"
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

        // 4. Match Stats
        const matchStats = await db.select({
            status: matches.status,
            count: count()
        }).from(matches).groupBy(matches.status)

        // 5. Recent 24h Activity
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const last24hVolume = await db.select({
            volume: sum(bets.stake)
        }).from(bets).where(gte(bets.createdAt, dayAgo))

        // 6. Top Winning Schools (by payout) - logic for insight
        // This is complex in JSON, skipping for now for speed

        return {
            success: true,
            summary: {
                totalVolume: totalStaked,
                totalPayout: totalPayout,
                estimatedProfit: platformProfit,
                totalUsers: Number(userStats[0]?.count || 0),
                totalBets: Number(bettingStats[0]?.betCount || 0),
                last24hVolume: Number(last24hVolume[0]?.volume || 0),
                payoutRatio: totalStaked > 0 ? (totalPayout / totalStaked) * 100 : 0
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
