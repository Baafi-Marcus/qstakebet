"use server"

import { db } from "@/lib/db"
import { users, predictions, matches } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { auth } from "@/lib/auth"

/**
 * Fetches essential user summary for the minimalist profile page.
 */
export async function getUserProfileSummary() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true, phone: true, createdAt: true, email: true, phoneVerified: true }
        })

        return {
            success: true,
            user,
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}


/**
 * Fetches a detailed list of user bets enriched with current match results and status.
 * Required for the high-end Expandable Bets UI.
 */
export async function getUserPredictionsWithDetails() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const userBets = await db.query.predictions.findMany({
            where: eq(predictions.userId, userId),
            orderBy: [desc(predictions.createdAt)],
            limit: 100 // Increased limit to find more sports matches after filtering
        })

        if (!userBets.length) return { success: true, predictions: [] }

        // Filter out virtual bets for the main My Bets page
        const sportsBets = userBets.filter(bet => {
            const selections = bet.selections as any[]
            return !selections.some(s => s.matchId?.startsWith('vmt-') || s.matchId?.startsWith('vr-'))
        }).slice(0, 50) // Keep the top 50 sports bets

        if (!sportsBets.length) return { success: true, predictions: [] }

        // 1. Collect all unique match IDs from all selections
        const matchIds = new Set<string>()
        sportsBets.forEach(bet => {
            const selections = bet.selections as any[]
            selections.forEach(s => {
                if (s.matchId) matchIds.add(s.matchId)
            })
        })

        // 2. Fetch current state for all involved matches
        const matchesData = await db.query.matches.findMany({
            where: sql`${matches.id} IN ${Array.from(matchIds)}`
        })

        // 3. Map matches for easy lookup
        const matchLookup = new Map(matchesData.map(m => [m.id, m]))

        // 4. Enrich bets with live match data
        const enrichedBets = userBets.map(bet => {
            const selections = (bet.selections as any[]).map(s => {
                const currentMatch = matchLookup.get(s.matchId)
                return {
                    ...s,
                    currentMatch: currentMatch ? {
                        status: currentMatch.status,
                        result: currentMatch.result,
                        isLive: currentMatch.isLive,
                        startTime: currentMatch.startTime
                    } : null
                }
            })

            return {
                ...bet,
                selections
            }
        })

        return { success: true, predictions: enrichedBets }
    } catch (e) {
        console.error("Get user predictions with details error:", e)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Updates user profile information.
 */
export async function updateUserProfile(formData: { name?: string; phone?: string }) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        await db.update(users)
            .set({
                name: formData.name,
                phone: formData.phone,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (e) {
        console.error("Update profile error:", e)
        return { success: false, error: "Internal Error" }
    }
}

