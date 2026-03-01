import { seededRandom, clamp } from "./virtuals"

export type QDartsPlayerID = 'michael' | 'jaguar' | 'charles' | 'righteous'
export type QDartsSkill = 'Low' | 'Medium' | 'High'

export interface QDartsPlayerInfo {
    id: QDartsPlayerID
    name: string
    color: string
    skill: QDartsSkill
}

export const Q_DARTS_PLAYERS: Record<QDartsPlayerID, Omit<QDartsPlayerInfo, 'skill'>> = {
    michael: { id: 'michael', name: 'Michael', color: '#3b82f6' }, // blue-500
    jaguar: { id: 'jaguar', name: 'Jaguar', color: '#eab308' }, // yellow-500
    charles: { id: 'charles', name: 'Charles', color: '#10b981' }, // emerald-500
    righteous: { id: 'righteous', name: 'Righteous', color: '#a855f7' } // purple-500
}

export interface QDartsThrow {
    score: number
    isBullseye: boolean
    isTriple: boolean
    isDouble: boolean
    isMiss: boolean
}

export interface QDartsRoundResult {
    roundNum: number // 1 to 5
    playerAThrows: QDartsThrow[]
    playerBThrows: QDartsThrow[]
    playerAScore: number
    playerBScore: number
}

export interface QDartsMatchOutcome {
    matchId: string
    timestamp: number
    playerA: QDartsPlayerInfo
    playerB: QDartsPlayerInfo
    rounds: QDartsRoundResult[]
    totalScoreA: number
    totalScoreB: number
    matchWinner: 'A' | 'B' | 'Tie'

    // Props
    totalBulls: number
    totalTriples: number
    perfectThrowByA: boolean // 3 Triple 20s (180) in one round
    perfectThrowByB: boolean
    highestScoringRound: number // 1 to 5
    highestScoringRoundPoints: number
    lateSurgeA: boolean // Scored > 40% of their points in rounds 4 and 5
    lateSurgeB: boolean
}

// Map skill to accurately throwing intended high-value targets
const getSkillMultiplier = (skill: QDartsSkill) => {
    switch (skill) {
        case 'High': return 1.3
        case 'Medium': return 1.0
        case 'Low': return 0.75
    }
}

// Simulate a single dart throw
const simulateThrow = (seed: number, skill: QDartsSkill, turnIndex: number): QDartsThrow => {
    const r1 = seededRandom(seed + turnIndex * 7)
    const r2 = seededRandom(seed + turnIndex * 13)

    const skillMod = getSkillMultiplier(skill)

    // Base dart scores: 1-20, 25 (Outer Bull), 50 (Inner Bull)
    // Professional darts aim for 20s, 19s, or Bulls.

    // Probabilities
    const pMiss = clamp(0.05 / skillMod, 0, 0.15)
    const pInnerBull = clamp(0.04 * skillMod, 0.01, 0.12)
    const pOuterBull = clamp(0.08 * skillMod, 0.03, 0.15)

    // Triple 20 is the highest value (60)
    const pTriple20 = clamp(0.12 * skillMod, 0.05, 0.35)
    // Other triples (19, 18)
    const pOtherTriple = clamp(0.15 * skillMod, 0.05, 0.25)

    if (r1 < pMiss) return { score: 0, isBullseye: false, isTriple: false, isDouble: false, isMiss: true }

    let roll = r1 - pMiss

    if (roll < pInnerBull) return { score: 50, isBullseye: true, isTriple: false, isDouble: false, isMiss: false }
    roll -= pInnerBull

    if (roll < pOuterBull) return { score: 25, isBullseye: true, isTriple: false, isDouble: false, isMiss: false }
    roll -= pOuterBull

    if (roll < pTriple20) return { score: 60, isBullseye: false, isTriple: true, isDouble: false, isMiss: false }
    roll -= pTriple20

    if (roll < pOtherTriple) {
        // High value triples (17, 18, 19)
        const val = 17 + Math.floor(r2 * 3)
        return { score: val * 3, isBullseye: false, isTriple: true, isDouble: false, isMiss: false }
    }
    roll -= pOtherTriple

    // Double ring (pDouble ~ 15%)
    const pDouble = clamp(0.15 * skillMod, 0.05, 0.25)
    if (roll < pDouble) {
        const val = 1 + Math.floor(r2 * 20)
        return { score: val * 2, isBullseye: false, isTriple: false, isDouble: true, isMiss: false }
    }

    // Singles: mostly high numbers (15-20) if skilled, more random if low skill
    const val = (r2 < 0.6 * skillMod) ? 15 + Math.floor(seededRandom(seed + turnIndex * 3) * 6) : 1 + Math.floor(seededRandom(seed + turnIndex * 5) * 20)
    return { score: val, isBullseye: false, isTriple: false, isDouble: false, isMiss: false }
}

export function simulateQDartsMatch(
    matchId: string,
    seed: number,
    timestamp?: number
): QDartsMatchOutcome {
    // 1. Pick 2 unique players
    const allIds = Object.keys(Q_DARTS_PLAYERS) as QDartsPlayerID[]

    // Use seed to pick players reliably
    const p1Idx = Math.floor(seededRandom(seed + 1) * allIds.length)
    let p2Idx = Math.floor(seededRandom(seed + 2) * allIds.length)
    if (p1Idx === p2Idx) p2Idx = (p2Idx + 1) % allIds.length

    const pA = Q_DARTS_PLAYERS[allIds[p1Idx]]
    const pB = Q_DARTS_PLAYERS[allIds[p2Idx]]

    // 2. Assign hidden skill levels (determines base probabilities)
    const skills: QDartsSkill[] = ['Low', 'Medium', 'High']
    const skillA = skills[Math.floor(seededRandom(seed + 3) * 3)]
    const skillB = skills[Math.floor(seededRandom(seed + 4) * 3)]

    const playerA: QDartsPlayerInfo = { ...pA, skill: skillA }
    const playerB: QDartsPlayerInfo = { ...pB, skill: skillB }

    // 3. Simulate 5 Rounds
    const rounds: QDartsRoundResult[] = []
    let totalScoreA = 0
    let totalScoreB = 0
    let totalBulls = 0
    let totalTriples = 0

    let perfectThrowByA = false
    let perfectThrowByB = false

    let highestScoringRound = 1
    let highestScoringRoundPoints = 0

    let pointsA_R4_R5 = 0
    let pointsB_R4_R5 = 0

    for (let r = 1; r <= 5; r++) {
        const throwsA: QDartsThrow[] = []
        const throwsB: QDartsThrow[] = []
        let roundScoreA = 0
        let roundScoreB = 0

        for (let t = 0; t < 3; t++) {
            // Player A throw
            const throwA = simulateThrow(seed + r * 100 + t * 10, playerA.skill, r * 10 + t)
            throwsA.push(throwA)
            roundScoreA += throwA.score
            if (throwA.isBullseye) totalBulls++
            if (throwA.isTriple) totalTriples++

            // Player B throw
            const throwB = simulateThrow(seed + r * 200 + t * 20, playerB.skill, r * 10 + t)
            throwsB.push(throwB)
            roundScoreB += throwB.score
            if (throwB.isBullseye) totalBulls++
            if (throwB.isTriple) totalTriples++
        }

        const isPerfectA = throwsA.every(t => t.score === 60)
        const isPerfectB = throwsB.every(t => t.score === 60)

        if (isPerfectA) perfectThrowByA = true
        if (isPerfectB) perfectThrowByB = true

        const roundTotal = roundScoreA + roundScoreB
        if (roundTotal > highestScoringRoundPoints) {
            highestScoringRoundPoints = roundTotal
            highestScoringRound = r
        }

        if (r >= 4) {
            pointsA_R4_R5 += roundScoreA
            pointsB_R4_R5 += roundScoreB
        }

        totalScoreA += roundScoreA
        totalScoreB += roundScoreB

        rounds.push({
            roundNum: r,
            playerAThrows: throwsA,
            playerBThrows: throwsB,
            playerAScore: roundScoreA,
            playerBScore: roundScoreB
        })
    }

    // In Darts, matches can tie on points unless it's leg-based, but here we count total match score across 5 rounds.
    let matchWinner: 'A' | 'B' | 'Tie' = 'Tie'

    if (totalScoreA > totalScoreB) matchWinner = 'A'
    else if (totalScoreB > totalScoreA) matchWinner = 'B'
    else matchWinner = 'Tie'

    return {
        matchId,
        timestamp: timestamp || Date.now(),
        playerA,
        playerB,
        rounds,
        totalScoreA,
        totalScoreB,
        matchWinner,
        totalBulls,
        totalTriples,
        perfectThrowByA,
        perfectThrowByB,
        highestScoringRound,
        highestScoringRoundPoints,
        lateSurgeA: pointsA_R4_R5 > (totalScoreA * 0.45),
        lateSurgeB: pointsB_R4_R5 > (totalScoreB * 0.45)
    }
}
