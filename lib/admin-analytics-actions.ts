"use server"

import { db } from "@/lib/db"
import { users, matches, tournaments, schools, fantasyLineups, chatMessages, chatRooms, chatRoomMembers } from "@/lib/db/schema"
import { count } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function getAdminAnalytics() {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Core counters
        const userStats = await db.select({ count: count() }).from(users)
        const schoolStats = await db.select({ count: count() }).from(schools)
        const tournamentStats = await db.select({ count: count() }).from(tournaments)

        // 2. Engagement statistics
        const lineupStats = await db.select({ count: count() }).from(fantasyLineups)
        const chatStats = await db.select({ count: count() }).from(chatMessages)
        const roomStats = await db.select({ count: count() }).from(chatRooms)
        const membershipStats = await db.select({ count: count() }).from(chatRoomMembers)

        // 3. Match breakdown
        const matchStats = await db.select({
            status: matches.status,
            count: count()
        }).from(matches).groupBy(matches.status)

        const totalRooms = Number(roomStats[0]?.count || 0)
        const totalMemberships = Number(membershipStats[0]?.count || 0)

        return {
            success: true,
            summary: {
                totalUsers: Number(userStats[0]?.count || 0),
                totalSchools: Number(schoolStats[0]?.count || 0),
                totalTournaments: Number(tournamentStats[0]?.count || 0),
                totalLineups: Number(lineupStats[0]?.count || 0),
                totalMessages: Number(chatStats[0]?.count || 0),
                totalRooms: totalRooms,
                totalMemberships: totalMemberships,
                avgMembersPerRoom: totalRooms > 0 ? Number((totalMemberships / totalRooms).toFixed(1)) : 0
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
