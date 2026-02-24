
import { Match } from "./types"

/**
 * Determines if a match should be locked for betting.
 * Cutoff is 5 minutes before the scheduled start time.
 */
export function getMatchLockStatus(match: Match): {
    isLocked: boolean,
    reason?: string,
    timeUntilLock?: number, // in minutes
    isOverdue: boolean,
    minutesOverdue: number
} {
    if (!match.scheduledAt) {
        return { isLocked: false, isOverdue: false, minutesOverdue: 0 }
    }

    const now = new Date()
    const startTime = new Date(match.scheduledAt)
    const diffMs = startTime.getTime() - now.getTime()
    const minutesUntilStart = diffMs / 60000

    // Overdue metrics
    const isOverdue = minutesUntilStart < 0
    const minutesOverdue = isOverdue ? Math.abs(minutesUntilStart) : 0

    // RELAXED LOCKING FOR "GHANA TIME"
    // We only lock if the status is explicitly 'live', 'finished', 'cancelled', 'locked', 'suspended', 'postponed' or 'abandoned'.
    const isExplicitlyLocked = ['live', 'finished', 'cancelled', 'locked', 'suspended', 'postponed', 'abandoned'].includes(match.status || "");

    if (isExplicitlyLocked) {
        return {
            isLocked: true,
            reason: `Match is ${match.status}`,
            timeUntilLock: 0,
            isOverdue,
            minutesOverdue
        }
    }

    // AUTOMATIC SOFT LOCK
    // Lock betting if a match is more than 5 minutes past scheduled start time
    // This protects against "past-posting" while allowing for slight delays.
    if (isOverdue && minutesOverdue > 5) {
        return {
            isLocked: true,
            reason: 'Match started',
            timeUntilLock: 0,
            isOverdue,
            minutesOverdue
        }
    }

    // Safety Net: Lock if 24 hours past scheduled time (Abandoned/Forgotten matches)
    const hoursPast = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (hoursPast > 24) {
        return {
            isLocked: true,
            reason: 'Match expired',
            timeUntilLock: 0,
            isOverdue,
            minutesOverdue
        }
    }

    return {
        isLocked: false,
        timeUntilLock: Math.max(0, minutesUntilStart),
        isOverdue,
        minutesOverdue
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

export interface GroupStanding {
    schoolId: string
    schoolName: string
    played: number
    won: number
    drawn: number
    lost: number
    gf: number // Goals For
    ga: number // Goals Against
    gd: number // Goal Difference
    points: number
}

/**
 * Calculates current group standings based on finished matches.
 */
export function calculateGroupStandings(matches: Match[], groupName: string): GroupStanding[] {
    const standings: Record<string, GroupStanding> = {}

    // Filter matches for this group and only those that are finished/settled
    const groupMatches = matches.filter(m => m.group === groupName && (m.status === 'finished' || m.status === 'settled'))

    groupMatches.forEach(match => {
        if (match.participants.length < 2) return

        const p1 = match.participants[0]
        const p2 = match.participants[1]

        // Attempt to get numeric scores from result field
        // Note: result can be number or string or null
        const s1 = typeof p1.result === 'number' ? p1.result : parseInt(String(p1.result || "0")) || 0
        const s2 = typeof p2.result === 'number' ? p2.result : parseInt(String(p2.result || "0")) || 0

            // Initialize schools in standings if not present
            ;[p1, p2].forEach(p => {
                if (!standings[p.schoolId]) {
                    standings[p.schoolId] = {
                        schoolId: p.schoolId,
                        schoolName: p.name,
                        played: 0, won: 0, drawn: 0, lost: 0,
                        gf: 0, ga: 0, gd: 0, points: 0
                    }
                }
            })

        const st1 = standings[p1.schoolId]
        const st2 = standings[p2.schoolId]

        st1.played++
        st2.played++
        st1.gf += s1
        st1.ga += s2
        st2.gf += s2
        st2.ga += s1

        if (s1 > s2) {
            st1.won++
            st1.points += 3
            st2.lost++
        } else if (s2 > s1) {
            st2.won++
            st2.points += 3
            st1.lost++
        } else {
            st1.drawn++
            st1.points++
            st2.drawn++
            st2.points++
        }
    })

    // Calculate GD and sort
    return Object.values(standings).map(s => ({
        ...s,
        gd: s.gf - s.ga
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.gd !== a.gd) return b.gd - a.gd
        return b.gf - a.gf
    })
}
