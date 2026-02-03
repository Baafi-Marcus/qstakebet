
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
