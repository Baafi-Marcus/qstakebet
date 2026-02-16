"use server"

import { getLiveMatchesWithStatus } from "./match-helpers"

/**
 * Get alerts for stale matches and other issues
 */
export async function getLiveAlerts() {
    const result = await getLiveMatchesWithStatus()
    if (!result.success) {
        return { alerts: [], criticalCount: 0, staleCount: 0 }
    }

    const matches = result.matches
    const alerts: Array<{ type: string; message: string; matchId: string }> = []

    matches.forEach(match => {
        if (match.staleness === "critical") {
            alerts.push({
                type: "critical",
                message: `${(match.participants as any[]).map((p: any) => p.name).join(" vs ")} - No update in ${match.minutesSinceUpdate} minutes`,
                matchId: match.id
            })
        } else if (match.staleness === "stale") {
            alerts.push({
                type: "warning",
                message: `${(match.participants as any[]).map((p: any) => p.name).join(" vs ")} - Last updated ${match.minutesSinceUpdate} minutes ago`,
                matchId: match.id
            })
        }
    })

    return {
        alerts,
        criticalCount: matches.filter(m => m.staleness === "critical").length,
        staleCount: matches.filter(m => m.staleness === "stale").length
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
