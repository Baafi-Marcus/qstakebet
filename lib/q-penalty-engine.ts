import { seededRandom, clamp } from "./virtuals"

export type UniversityID = 'ug' | 'knust' | 'ucc' | 'uds' | 'umat' | 'uew' | 'tatu' | 'knu'

export interface UniversityInfo {
    id: UniversityID
    name: string
    shortName: string
    color: string
}

export const UNIVERSITIES: Record<UniversityID, UniversityInfo> = {
    ug: { id: 'ug', name: 'University of Ghana', shortName: 'UG', color: '#1a365d' }, // Navy
    knust: { id: 'knust', name: 'KNUST', shortName: 'Tech', color: '#744210' }, // Gold/Brown
    ucc: { id: 'ucc', name: 'University of Cape Coast', shortName: 'Vars', color: '#c05621' }, // Orange
    uds: { id: 'uds', name: 'UDS', shortName: 'UDS', color: '#276749' }, // Green
    umat: { id: 'umat', name: 'UMaT', shortName: 'Tarkwa', color: '#2d3748' }, // Slate
    uew: { id: 'uew', name: 'UEW', shortName: 'Winneba', color: '#702459' }, // Purple
    tatu: { id: 'tatu', name: 'Tamale Tech', shortName: 'TaTu', color: '#2c5282' }, // Blue
    knu: { id: 'knu', name: 'Kings University', shortName: 'KNU', color: '#9b2c2c' }, // Red
}

export interface PenaltyAttempt {
    roundNum: number
    teamId: UniversityID
    isScored: boolean
    direction: 'left' | 'center' | 'right'
    goalieDirection: 'left' | 'center' | 'right'
}

export interface QPenaltyMatchOutcome {
    matchId: string
    timestamp: number
    teamA: UniversityInfo
    teamB: UniversityInfo
    attemptsA: PenaltyAttempt[]
    attemptsB: PenaltyAttempt[]
    scoreA: number
    scoreB: number
    winner: 'A' | 'B'
    wentToSuddenDeath: boolean
    totalGoals: number
    firstTeamToMiss?: 'A' | 'B'
    bothTeamsScoredInFirstRound: boolean
}

const DIRECTIONS: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']

export function simulateQPenaltyMatch(
    matchId: string,
    seed: number,
    timestamp?: number,
    providedSchools?: { name: string, shortName?: string, color?: string }[]
): QPenaltyMatchOutcome {
    // 1. Pick 2 unique universities
    let teams: UniversityInfo[] = []
    
    if (providedSchools && providedSchools.length >= 2) {
        const p1Idx = Math.floor(seededRandom(seed + 1) * providedSchools.length)
        let p2Idx = Math.floor(seededRandom(seed + 2) * providedSchools.length)
        if (p1Idx === p2Idx) p2Idx = (p2Idx + 1) % providedSchools.length

        const s1 = providedSchools[p1Idx]
        const s2 = providedSchools[p2Idx]

        const mapToInfo = (s: any, idx: number): UniversityInfo => ({
            id: (idx === 0 ? 'A' : 'B') as any,
            name: s.name,
            shortName: s.shortName || s.name.split(' ')[0],
            color: s.color || `hsl(${seededRandom(seed + idx * 100) * 360}, 70%, 50%)`
        })

        teams = [mapToInfo(s1, 0), mapToInfo(s2, 1)]
    } else {
        const allIds = Object.keys(UNIVERSITIES) as UniversityID[]
        const p1Idx = Math.floor(seededRandom(seed + 1) * allIds.length)
        let p2Idx = Math.floor(seededRandom(seed + 2) * allIds.length)
        if (p1Idx === p2Idx) p2Idx = (p2Idx + 1) % allIds.length
        teams = [UNIVERSITIES[allIds[p1Idx]], UNIVERSITIES[allIds[p2Idx]]]
    }

    const teamA = teams[0]
    const teamB = teams[1]

    const attemptsA: PenaltyAttempt[] = []
    const attemptsB: PenaltyAttempt[] = []
    let scoreA = 0
    let scoreB = 0
    let wentToSuddenDeath = false
    let firstTeamToMiss: 'A' | 'B' | undefined = undefined

    // Simulate standard 5 rounds
    for (let r = 1; r <= 5; r++) {
        // Team A attempt
        const shootDirA = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 1) * 3)]
        const saveDirA = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 2) * 3)]
        const isScoredA = shootDirA !== saveDirA || seededRandom(seed + (r * 10) + 3) < 0.2 // 20% "mishit" save chance even on wrong direction? No, let's keep it simple: wrong direction = goal
        
        const scoredA = shootDirA !== saveDirA
        if (scoredA) scoreA++
        else if (!firstTeamToMiss) firstTeamToMiss = 'A'
        
        attemptsA.push({ roundNum: r, teamId: teamA.id, isScored: scoredA, direction: shootDirA, goalieDirection: saveDirA })

        // Check if Team B can still win or tie (early knockout)
        // Removed for virtuals: better to show all 5 rounds unless the UI handle it. 
        // Actually, virtuals usually show the full sequence. Let's simulate full 5.

        // Team B attempt
        const shootDirB = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 4) * 3)]
        const saveDirB = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 5) * 3)]
        const scoredB = shootDirB !== saveDirB
        if (scoredB) scoreB++
        else if (!firstTeamToMiss && firstTeamToMiss !== 'A') firstTeamToMiss = 'B'

        attemptsB.push({ roundNum: r, teamId: teamB.id, isScored: scoredB, direction: shootDirB, goalieDirection: saveDirB })
    }

    // Sudden death if tied
    if (scoreA === scoreB) {
        wentToSuddenDeath = true
        let r = 6
        while (scoreA === scoreB && r < 15) { // Cap at 15 to prevent infinite loop
            // Team A
            const shootDirA = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 1) * 3)]
            const saveDirA = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 2) * 3)]
            const scoredA = shootDirA !== saveDirA
            
            // Team B
            const shootDirB = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 4) * 3)]
            const saveDirB = DIRECTIONS[Math.floor(seededRandom(seed + (r * 10) + 5) * 3)]
            const scoredB = shootDirB !== saveDirB

            attemptsA.push({ roundNum: r, teamId: teamA.id, isScored: scoredA, direction: shootDirA, goalieDirection: saveDirA })
            attemptsB.push({ roundNum: r, teamId: teamB.id, isScored: scoredB, direction: shootDirB, goalieDirection: saveDirB })

            if (scoredA) scoreA++
            else if (!firstTeamToMiss) firstTeamToMiss = 'A'

            if (scoredB) scoreB++
            else if (!firstTeamToMiss && firstTeamToMiss !== 'A') firstTeamToMiss = 'B'

            r++
        }
    }

    // Final winner
    const winner = scoreA > scoreB ? 'A' : 'B'

    return {
        matchId,
        timestamp: timestamp || Date.now(),
        teamA,
        teamB,
        attemptsA,
        attemptsB,
        scoreA,
        scoreB,
        winner,
        wentToSuddenDeath,
        totalGoals: scoreA + scoreB,
        firstTeamToMiss,
        bothTeamsScoredInFirstRound: attemptsA[0].isScored && attemptsB[0].isScored
    }
}
