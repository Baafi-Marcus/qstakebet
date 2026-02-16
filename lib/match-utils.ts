
import { Match } from "./types"

/**
 * Determines if a match should be locked for betting.
 * Cutoff is 5 minutes before the scheduled start time.
 */
export function getMatchLockStatus(match: Match): {
    isLocked: boolean,
    reason?: string,
    timeUntilLock?: number // in minutes
} {
    if (!match.scheduledAt) {
        return { isLocked: false }
    }

    const now = new Date()
    const startTime = new Date(match.scheduledAt)
    const diffMs = startTime.getTime() - now.getTime()
    const minutesUntilStart = diffMs / 60000

    // RELAXED LOCKING FOR "GHANA TIME"
    // We do NOT lock based on strict time anymore. 
    // We only lock if the status is explicitly 'live', 'finished', 'cancelled' or 'locked'.

    const isExplicitlyLocked = ['live', 'finished', 'cancelled', 'locked'].includes(match.status || "");

    if (isExplicitlyLocked) {
        return {
            isLocked: true,
            reason: `Match is ${match.status}`,
            timeUntilLock: 0
        }
    }

    // Safety Net: Lock if 24 hours past scheduled time (Abandoned/Forgotten matches)
    const hoursPast = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (hoursPast > 24) {
        return {
            isLocked: true,
            reason: 'Match expired (24h+ overdue)',
            timeUntilLock: 0
        }
    }

    return {
        isLocked: false,
        timeUntilLock: minutesUntilStart // Informational only now
    }
}

/**
 * Validate scores based on sport type
 * This is a pure utility function (no DB access)
 */
export function validateScores(sportType: string, scores: any, metadata?: any): {
    isValid: boolean
    warnings: string[]
} {
    const warnings: string[] = []

    if (sportType === "basketball") {
        // Check quarter scores
        if (metadata?.basketballDetails) {
            Object.values(metadata.basketballDetails).forEach((school: any) => {
                ['q1', 'q2', 'q3', 'q4'].forEach(quarter => {
                    if (school[quarter] > 50) {
                        warnings.push(`Unusually high quarter score: ${school[quarter]} points`)
                    }
                    if (school[quarter] < 0) {
                        warnings.push(`Negative score detected`)
                    }
                })
            })
        }
    }

    if (sportType === "football" || sportType === "handball") {
        if (metadata?.footballDetails) {
            Object.values(metadata.footballDetails).forEach((school: any) => {
                if (school.ht > school.ft) {
                    warnings.push(`Half-time score (${school.ht}) is greater than full-time (${school.ft})`)
                }
                if (school.ft < 0 || school.ht < 0) {
                    warnings.push(`Negative score detected`)
                }
                if (school.ft > 30) {
                    warnings.push(`Unusually high score: ${school.ft} goals`)
                }
            })
        }
    }

    if (sportType === "quiz") {
        if (metadata?.quizDetails) {
            Object.values(metadata.quizDetails).forEach((school: any) => {
                ['r1', 'r2', 'r3', 'r4', 'r5'].forEach(round => {
                    if (school[round] < 0) {
                        warnings.push(`Negative score detected in ${round}`)
                    }
                    if (school[round] > 100) {
                        warnings.push(`Unusually high round score: ${school[round]} points`)
                    }
                })
            })
        }
    }

    return {
        isValid: warnings.length === 0,
        warnings
    }
}
