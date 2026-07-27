"use server"

import { db } from "@/lib/db"
import { predictions, matches, tournaments } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { PlaceBetSchema } from "@/lib/validators"

export type SelectionInput = {
    matchId: string
    tournamentId?: string // Added
    selectionId: string
    label: string
    odds: number
    marketName: string
    matchLabel: string
}

export async function placeBet(stake: number, selections: SelectionInput[], bonusId?: string, bonusAmount: number = 0, mode: 'single' | 'multi' = 'multi') {
    // Rate limit: 5 bets per minute per IP
    const limiter = await rateLimit("place-bet", 5, 60000);
    if (!limiter.success) {
        return { success: false, error: limiter.error };
    }

    // Zod Validation
    const validation = PlaceBetSchema.safeParse({ stake, selections, bonusId, bonusAmount, mode });
    if (!validation.success) {
        console.error("Bet validation failed:", validation.error.format());
        return { success: false, error: validation.error.issues[0].message };
    }

    const session = await auth()
    if (!session?.user?.id) {
        console.warn("Bet placement attempt without session");
        return { success: false, error: "Please log in to place a bet" }
    }

    if (session.user.role === "admin") {
        return { success: false, error: "Administrators are restricted from placing bets." }
    }

    const { FINANCE_LIMITS } = await import("@/lib/constants")

    // Limit check
    if (stake > FINANCE_LIMITS.BET.MAX_STAKE) {
        return { success: false, error: `Maximum stake allowed is GHS ${FINANCE_LIMITS.BET.MAX_STAKE}` }
    }

    const userId = session.user.id

    // NEW: Check if any match is locked
    const { getMatchLockStatus } = await import("@/lib/match-utils")

    for (const selection of selections) {
        // Handle Tournament Outrights
        if (selection.tournamentId || selection.matchId.startsWith('outright-')) {
            const tournamentId = selection.tournamentId || selection.matchId.replace('outright-', '');
            const tData = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);

            if (!tData.length) {
                return { success: false, error: "Tournament not found." }
            }

            const tournament = tData[0];
            if (!tournament.isOutrightEnabled || tournament.winnerId) {
                return { success: false, error: `The market for "${selection.matchLabel}" is currently closed.` }
            }

            // Verify odds
            const currentItem = tournament.outrightOdds?.find(o => o.schoolId === selection.selectionId);
            if (!currentItem || Math.abs(currentItem.odd - selection.odds) > 0.1) {
                return { success: false, error: "The odds for your selection have changed. Please update your slip." }
            }

            // Enforce Singles Only for outrights
            if (selections.length > 1) {
                return { success: false, error: "Tournament Winner predictions must be placed as individual single bets." }
            }

            continue;
        }

        // Handle Virtual Matches
        if (selection.matchId.startsWith('vmt-') || selection.matchId.startsWith('vr-')) {
            // For Instant Virtuals, we allow betting on any round ID. 
            // Results are uniquely seeded per user, so they never expire.
            continue;
        }

        const matchData = await db.select().from(matches)
            .where(eq(matches.id, selection.matchId))
            .limit(1)

        if (!matchData.length) {
            return { success: false, error: "One or more matches in your betslip were not found." }
        }

        const lockStatus = getMatchLockStatus(matchData[0] as any)

        if (lockStatus.isLocked) {
            return {
                success: false,
                error: `The match "${selection.matchLabel}" is locked (${lockStatus.reason}). Please remove it to place your bet.`
            }
        }
    }

    try {
        const betId = `prd-${Math.random().toString(36).substr(2, 9)}`
        await db.insert(predictions).values({
            id: betId,
            userId,
            status: "pending",
            selections: selections,
            mode: mode,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        
        // Record stake for dynamic odds
        const { recordBetStake } = await import("@/lib/odds-engine")
        for (const selection of selections) {
            if (!selection.tournamentId && !selection.matchId.startsWith('outright-')) {
                // Use a default small weight for prediction instead of stake
                await recordBetStake(selection.matchId, selection.selectionId, 1)
            }
        }
        
        return { success: true, betId }
    } catch (error: unknown) {
        console.error("Prediction placement error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to place prediction. Please try again."
        return { success: false, error: errorMessage }
    }
}

/**
 * Saves current betslip selections and returns a unique 6-char booking code.
 */
export async function bookBet(selections: SelectionInput[]) {
    if (!selections.length) return { success: false, error: "Slip is empty" }

    try {
        return { success: false, error: "Booking is disabled" }
    } catch (error) {
        console.error("Booking error:", error)
        return { success: false, error: "Failed to book bet" }
    }
}

/**
 * Loads selections from a booking code and enriches them with current match status.
 */
export async function loadBookedBet(code: string) {
    if (!code) return { success: false, error: "Please enter a code" }

    try {
        const cleanCode = code.trim().toUpperCase()

        return { success: false, error: "Booking code not found" }

        return { success: true, selections: [] }
    } catch (error) {
        console.error("Load booking error:", error)
        return { success: false, error: "Failed to load booking code" }
    }
}
