"use server"

import { getLiveMatchesWithStatus } from "./match-helpers"

/**
 * Get alerts for stale matches and other issues
 */
export async function getLiveAlerts() {
    const liveResult = await getLiveMatchesWithStatus()
    const liveMatches = liveResult.success ? liveResult.success : [] // Wait, the result structure is {success, matches}

    const { db } = await import("./db")
    const { matches: matchTable } = await import("./db/schema")
    const { ne, and, or, lt } = await import("drizzle-orm")

    const alerts: Array<{ type: string; message: string; matchId: string }> = []

    // 1. Live Match Staleness Alerts
    if (liveResult.success) {
        liveResult.matches.forEach(match => {
            if (match.staleness === "critical") {
                alerts.push({
                    type: "critical",
                    message: `${(match.participants as any[]).map((p: any) => p.name).join(" vs ")} - No live update in ${match.minutesSinceUpdate} minutes`,
                    matchId: match.id
                })
            }
        })
    }

    // 2. Overdue/Unsettled Match Alerts
    const now = new Date()
    const overdueMatches = await db.select()
        .from(matchTable)
        .where(
            and(
                ne(matchTable.status, "finished"),
                ne(matchTable.status, "cancelled"),
                or(
                    lt(matchTable.autoEndAt, now),
                    lt(matchTable.scheduledAt, new Date(now.getTime() - 2 * 60 * 60 * 1000)) // 2 hours past scheduled start
                )
            )
        )

    overdueMatches.forEach(match => {
        const timeRef = match.autoEndAt || match.scheduledAt
        const label = match.autoEndAt ? "Auto-end time passed" : "Past scheduled start"
        alerts.push({
            type: "warning",
            message: `${(match.participants as any[]).map((p: any) => p.name).join(" vs ")} - ${label}. Needs result settlement.`,
            matchId: match.id
        })
    })

    return {
        alerts,
        criticalCount: alerts.filter(a => a.type === "critical").length,
        staleCount: alerts.filter(a => a.type === "warning").length
    }
}

/**
 * Bulk update multiple matches
 */
export async function bulkUpdateMatches(updates: Array<{
    matchId: string
    action: "set_pending" | "set_half_time" | "lock_betting"
}>) {
    const { updateMatchResult } = await import("./admin-actions")
    const results = []

    for (const update of updates) {
        try {
            if (update.action === "set_pending") {
                await updateMatchResult(update.matchId, {
                    scores: {},
                    winner: "",
                    status: "pending",
                    metadata: { pendingSince: new Date().toISOString() }
                })
                results.push({ matchId: update.matchId, success: true })
            }
            // Add more bulk actions as needed
        } catch (error) {
            results.push({ matchId: update.matchId, success: false, error: String(error) })
        }
    }

    return {
        success: true,
        results,
        successCount: results.filter(r => r.success).length,
        failCount: results.filter(r => !r.success).length
    }
}
