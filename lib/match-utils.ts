
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

    // Lock if within 5 minutes of start
    if (minutesUntilStart <= 5 && minutesUntilStart > 0) {
        return {
            isLocked: true,
            reason: 'Match starting soon',
            timeUntilLock: 0
        }
    }

    // Lock if match has already started or is finished
    if (minutesUntilStart <= 0 || match.status === 'finished') {
        return {
            isLocked: true,
            reason: match.status === 'finished' ? 'Match finished' : 'Match has started',
            timeUntilLock: 0
        }
    }

    return {
        isLocked: false,
        timeUntilLock: minutesUntilStart
    }
}
