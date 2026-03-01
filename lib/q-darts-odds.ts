import { QDartsMatchOutcome } from './q-darts-engine'
import { calculateOddsFromProbability, calculatePropOdds, clamp } from './virtuals'
import { VirtualSelection } from './virtuals'

export interface QDartsMarket {
    id: string
    name: string
    description: string // Added for help tooltips
    selections: {
        id: string
        label: string
        odds: number
        probability: number
    }[]
}

export function generateQDartsMarkets(outcome: QDartsMatchOutcome): QDartsMarket[] {
    const markets: QDartsMarket[] = []

    const pA = outcome.playerA
    const pB = outcome.playerB

    const skillMap = { 'Low': 0.8, 'Medium': 1.0, 'High': 1.2 }
    const sA = skillMap[pA.skill]
    const sB = skillMap[pB.skill]

    // Base Win Prob (adjusted by skill difference)
    const totalS = sA + sB
    const probA_raw = sA / totalS
    const probB_raw = sB / totalS

    // 1. MATCH WINNER (Include DRAW)
    const probDraw = 0.10 // 10% base chance for a tie in total points over 5 rounds
    const adjProbA = probA_raw * (1 - probDraw)
    const adjProbB = probB_raw * (1 - probDraw)

    const marginWinner = 0.15
    const oddsWinnerA = calculateOddsFromProbability(adjProbA, marginWinner, outcome.timestamp, 1.10, 5.00) || 1.10
    const oddsWinnerB = calculateOddsFromProbability(adjProbB, marginWinner, outcome.timestamp + 1, 1.10, 5.00) || 1.10
    const oddsDraw = calculateOddsFromProbability(probDraw, marginWinner, outcome.timestamp + 2, 4.00, 15.00) || 8.00

    markets.push({
        id: 'winner',
        name: 'Match Winner (1X2)',
        description: 'Predict the winner of the match or if it will end in a Draw (Tie in total points).',
        selections: [
            { id: `winner_${pA.id}`, label: pA.name, odds: oddsWinnerA, probability: adjProbA },
            { id: `winner_draw`, label: 'Draw', odds: oddsDraw, probability: probDraw },
            { id: `winner_${pB.id}`, label: pB.name, odds: oddsWinnerB, probability: adjProbB }
        ]
    })

    // 2. TOTAL MATCH SCORE (Over/Under) - 15-18% margin
    const marginTotal = 0.16
    const projectedTotal = (sA + sB) * 5 * 105
    const bands = [
        Math.floor(projectedTotal * 0.7) + 0.5,
        Math.floor(projectedTotal * 0.85) + 0.5,
        Math.floor(projectedTotal * 1.0) + 0.5,
        Math.floor(projectedTotal * 1.15) + 0.5
    ]

    const totalSelections: any[] = []
    bands.forEach(band => {
        const diff = (projectedTotal - band) / 100
        const pOver = 1 / (1 + Math.exp(-diff))
        if (pOver > 0.1 && pOver < 0.9) {
            totalSelections.push({ id: `total_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pOver, 0.10, marginTotal, 1.10, 8.00) || 1.10, probability: pOver })
            totalSelections.push({ id: `total_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pOver, 0.10, marginTotal, 1.10, 8.00) || 1.10, probability: 1 - pOver })
        }
    })

    if (totalSelections.length > 0) {
        markets.push({
            id: 'total_score',
            name: 'Total Match Score',
            description: 'Total combined score of both players at the end of 5 rounds.',
            selections: totalSelections
        })
    }

    // 3. PER ROUND MARKETS
    for (let r = 1; r <= 5; r++) {
        const marginRound = 0.18
        // Round Winner
        markets.push({
            id: `round_${r}_winner`,
            name: `Round ${r} Winner`,
            description: `Which player will score more points in Round ${r}?`,
            selections: [
                { id: `round_${r}_winner_A`, label: pA.name, odds: calculateOddsFromProbability(probA_raw, marginRound, outcome.timestamp + r * 10) || 1.80, probability: probA_raw },
                { id: `round_${r}_winner_B`, label: pB.name, odds: calculateOddsFromProbability(probB_raw, marginRound, outcome.timestamp + r * 10 + 1) || 1.80, probability: probB_raw }
            ]
        })

        // Round Score O/U
        const projRound = (sA + sB) * 105
        const rBand = Math.floor(projRound) + 0.5
        const diff = (projRound - rBand) / 50
        const pROver = 1 / (1 + Math.exp(-diff))
        markets.push({
            id: `round_${r}_total`,
            name: `Round ${r} Points`,
            description: `Total points scored by both players in Round ${r}.`,
            selections: [
                { id: `round_${r}_over_${rBand}`, label: `Over ${rBand}`, odds: calculatePropOdds(pROver, 0.15, marginRound) || 1.85, probability: pROver },
                { id: `round_${r}_under_${rBand}`, label: `Under ${rBand}`, odds: calculatePropOdds(1 - pROver, 0.15, marginRound) || 1.85, probability: 1 - pROver }
            ]
        })
    }

    // 4. PROPS
    const marginProps = 0.22

    // Any Bullseye
    const pAnyBull = clamp((sA + sB) * 0.35, 0.1, 0.9)
    markets.push({
        id: 'any_bullseye',
        name: 'Any Bullseye in Match',
        description: 'Will any player hit a Bullseye (25 or 50) during the match?',
        selections: [
            { id: 'any_bull_yes', label: 'Yes', odds: calculatePropOdds(pAnyBull, 0, marginProps) || 1.5, probability: pAnyBull },
            { id: 'any_bull_no', label: 'No', odds: calculatePropOdds(1 - pAnyBull, 0, marginProps) || 2.5, probability: 1 - pAnyBull }
        ]
    })

    // Total Triples
    const projTriples = (sA + sB) * 1.5
    const tBand = Math.floor(projTriples) + 0.5
    const pTOver = 1 / (1 + Math.exp(-(projTriples - tBand)))
    markets.push({
        id: 'total_triples',
        name: 'Total Triples',
        description: 'Combined number of triple rings hit by both players.',
        selections: [
            { id: `triples_over_${tBand}`, label: `Over ${tBand}`, odds: calculatePropOdds(pTOver, 0.1, marginProps) || 1.8, probability: pTOver },
            { id: `triples_under_${tBand}`, label: `Under ${tBand}`, odds: calculatePropOdds(1 - pTOver, 0.1, marginProps) || 1.8, probability: 1 - pTOver }
        ]
    })

    // 5. PROPS: PERFECT THROW (180 - 3 Triple 20s in a round)
    // Extremely rare.
    const p180 = (sA + sB) * 0.05
    if (p180 >= 0.05 && p180 <= 0.50) {
        markets.push({
            id: 'perfect_throw',
            name: 'Any Player Perfect Throw (180)',
            description: 'Will any player score a maximum of 180 points (3 Triple 20s) in a single round?',
            selections: [
                { id: `perfect_yes`, label: 'Yes', odds: calculatePropOdds(p180, 0.0, marginProps, 1.50, 15.00) || 4.50, probability: p180 },
                { id: `perfect_no`, label: 'No', odds: calculatePropOdds(1 - p180, 0.0, marginProps, 1.01, 1.80) || 1.10, probability: 1 - p180 }
            ]
        })
    }

    return markets
}

// ==========================================
// CORRELATION & SAFETY ENGINE
// ==========================================

export function checkQDartsCorrelation(selections: VirtualSelection[]): boolean {
    if (selections.length <= 1) return false;
    for (let i = 0; i < selections.length; i++) {
        for (let j = i + 1; j < selections.length; j++) {
            const s1 = selections[i]
            const s2 = selections[j]
            // We only block choosing the EXACT same market twice in one match
            if (s1.matchId === s2.matchId && s1.marketName === s2.marketName) return true
        }
    }
    return false
}

export function evaluateQDartsBet(sel: VirtualSelection, outcome: QDartsMatchOutcome): boolean {
    if (sel.marketName === 'Match Winner (1X2)') {
        if (sel.selectionId === 'winner_draw') return outcome.matchWinner === 'Tie'
        const pId = sel.selectionId.replace('winner_', '')
        return (outcome.matchWinner === 'A' && outcome.playerA.id === pId) ||
            (outcome.matchWinner === 'B' && outcome.playerB.id === pId)
    }

    if (sel.marketName === 'Total Match Score') {
        const total = outcome.totalScoreA + outcome.totalScoreB
        const parts = sel.selectionId.split('_')
        const type = parts[1] // over or under
        const band = parseFloat(parts[2])
        return type === 'over' ? total > band : total < band
    }

    if (sel.marketName.includes('Round') && sel.marketName.includes('Winner')) {
        const rNum = parseInt(sel.marketName.split(' ')[1])
        const round = outcome.rounds.find(r => r.roundNum === rNum)
        if (!round) return false
        const winner = round.playerAScore > round.playerBScore ? 'A' : (round.playerBScore > round.playerAScore ? 'B' : 'Tie')
        if (sel.selectionId.endsWith('_A')) return winner === 'A'
        if (sel.selectionId.endsWith('_B')) return winner === 'B'
        // We don't have Draw for rounds in this simple version
        return false
    }

    if (sel.marketName.includes('Round') && sel.marketName.includes('Points')) {
        const rNum = parseInt(sel.marketName.split(' ')[1])
        const round = outcome.rounds.find(r => r.roundNum === rNum)
        if (!round) return false
        const total = round.playerAScore + round.playerBScore
        const parts = sel.selectionId.split('_')
        const band = parseFloat(parts[parts.length - 1])
        return sel.selectionId.includes('_over_') ? total > band : total < band
    }

    if (sel.marketName === 'Any Bullseye in Match') {
        const hadBull = outcome.totalBulls > 0
        return sel.selectionId === 'any_bull_yes' ? hadBull : !hadBull
    }

    if (sel.marketName === 'Total Triples') {
        const parts = sel.selectionId.split('_')
        const band = parseFloat(parts[parts.length - 1])
        return sel.selectionId.includes('_over_') ? outcome.totalTriples > band : outcome.totalTriples < band
    }

    if (sel.marketName === 'Any Player Perfect Throw (180)') {
        const type = sel.selectionId.replace('perfect_', '') // yes or no
        const hadPerfect = outcome.perfectThrowByA || outcome.perfectThrowByB
        return type === 'yes' ? hadPerfect : !hadPerfect
    }

    return false
}
