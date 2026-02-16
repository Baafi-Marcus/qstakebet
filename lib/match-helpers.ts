"use server"

import { db } from "./db"
import { matchHistory, matches } from "./db/schema"
import { eq, desc, and } from "drizzle-orm"

/**
 * Record a match update to history
 */
export async function recordMatchUpdate(data: {
    matchId: string
    action: "score_update" | "status_change" | "period_change"
    previousData: any
    newData: any
    updatedBy?: string
    metadata?: any
}) {
    try {
        const id = `mh-${Date.now()}-${Math.random().toString(36).substring(7)}`
        await db.insert(matchHistory).values({
            id,
            matchId: data.matchId,
            action: data.action,
            previousData: data.previousData,
            newData: data.newData,
            updatedBy: data.updatedBy || "system",
            metadata: data.metadata || {}
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to record match update:", error)
        return { success: false, error: "Failed to log update" }
    }
}

/**
 * Get match history timeline
 */
export async function getMatchHistory(matchId: string) {
    try {
        const history = await db.select()
            .from(matchHistory)
            .where(eq(matchHistory.matchId, matchId))
            .orderBy(desc(matchHistory.createdAt))

        return { success: true, history }
    } catch (error) {
        console.error("Failed to fetch match history:", error)
        return { success: false, error: "Failed to fetch history", history: [] }
    }
}

/**
 * Get all live matches with staleness info
 */
export async function getLiveMatchesWithStatus() {
    try {
        const liveMatches = await db.select()
            .from(matches)
            .where(eq(matches.status, "live"))

        const now = new Date()
        const matchesWithStatus = liveMatches.map(match => {
            const lastUpdate = match.lastTickAt || match.createdAt
            const minutesSinceUpdate = lastUpdate
                ? Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / 60000)
                : 999

            let staleness: "fresh" | "stale" | "critical" = "fresh"
            if (minutesSinceUpdate > 15) staleness = "critical"
            else if (minutesSinceUpdate > 5) staleness = "stale"

            return {
                ...match,
                minutesSinceUpdate,
                staleness
            }
        })

        return { success: true, matches: matchesWithStatus }
    } catch (error) {
        console.error("Failed to fetch live matches:", error)
        return { success: false, error: "Failed to fetch matches", matches: [] }
    }
}
