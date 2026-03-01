import { QDartsMatchOutcome } from './q-darts-engine'
import { calculateOddsFromProbability, calculatePropOdds } from './virtuals'
import { VirtualSelection } from './virtuals'

export interface QDartsMarket {
    id: string
    name: string
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
    let probA = sA / totalS
    let probB = sB / totalS

    // 1. MATCH WINNER (12-15% margin)
    const marginWinner = 0.13
    const oddsWinnerA = calculateOddsFromProbability(probA, marginWinner, outcome.timestamp, 1.08, 3.50, 0.10) || 1.08
    const oddsWinnerB = calculateOddsFromProbability(probB, marginWinner, outcome.timestamp + 1, 1.08, 3.50, 0.10) || 1.08

    // Only add if < 78% prob
    if (probA <= 0.78 && probB <= 0.78) {
        markets.push({
            id: 'winner',
            name: 'Match Winner',
            selections: [
                { id: `winner_${pA.id}`, label: pA.name, odds: oddsWinnerA, probability: probA },
                { id: `winner_${pB.id}`, label: pB.name, odds: oddsWinnerB, probability: probB }
            ]
        })
    }

    // 2. TOTAL MATCH SCORE (Over/Under) - 15-18% margin
    const marginTotal = 0.16
    const projectedTotal = (sA + sB) * 5 * 100 // VERY rough baseline: 100 pts per round per player at Medium skill
    const bands = [
        Math.floor(projectedTotal * 0.85) + 0.5,
        Math.floor(projectedTotal * 0.95) + 0.5,
        Math.floor(projectedTotal * 1.05) + 0.5,
        Math.floor(projectedTotal * 1.15) + 0.5
    ]

    const totalSelections: any[] = []
    bands.forEach(band => {
        const diff = (projectedTotal - band) / 100
        const pOver = 1 / (1 + Math.exp(-diff))
        if (pOver >= 0.22 && pOver <= 0.78) {
            totalSelections.push({ id: `total_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pOver, 0.10, marginTotal, 1.08, 3.50) || 1.08, probability: pOver })
            totalSelections.push({ id: `total_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pOver, 0.10, marginTotal, 1.08, 3.50) || 1.08, probability: 1 - pOver })
        }
    })

    if (totalSelections.length > 0) {
        markets.push({ id: 'total_score', name: 'Total Match Score', selections: totalSelections })
    }

    // 3. PROPS: TOTAL BULLS
    const marginProps = 0.22
    const projectedBulls = (sA + sB) * 1.2
    const bullBands = [0.5, 1.5, 2.5]

    const bullSelections: any[] = []
    bullBands.forEach(band => {
        const diff = projectedBulls - band
        const pOver = 1 / (1 + Math.exp(-diff * 1.5))
        if (pOver >= 0.22 && pOver <= 0.78) {
            bullSelections.push({ id: `bulls_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pOver, 0.10, marginProps, 1.08, 3.50) || 1.08, probability: pOver })
            bullSelections.push({ id: `bulls_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pOver, 0.10, marginProps, 1.08, 3.50) || 1.08, probability: 1 - pOver })
        }
    })
    if (bullSelections.length > 0) {
        markets.push({ id: 'total_bulls', name: 'Total Bulls', selections: bullSelections })
    }

    // 4. PROPS: PERFECT THROW (180 - 3 Triple 20s in a round)
    // Extremely rare.
    const p180 = (sA + sB) * 0.05
    if (p180 >= 0.05 && p180 <= 0.50) {
        markets.push({
            id: 'perfect_throw',
            name: 'Any Player Perfect Throw (180)',
            selections: [
                { id: `perfect_yes`, label: 'Yes', odds: calculatePropOdds(p180, 0.0, marginProps, 1.50, 15.00) || 4.50, probability: p180 },
                // Usually bookies don't offer purely "No" for 180s when odds are very short, but for safety:
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

            // If betting on same match, multiple strict rules apply
            if (s1.matchId === s2.matchId) {
                // Cannot combine Match Winner with Late Surge of the same player
                if (s1.marketName === 'Match Winner' && s2.marketName === 'Late Surge') {
                    if (s1.label === s2.label.split(' ')[0]) return true
                }

                // Cannot combine Total score Over with Highest Scoring Round Over if both refer to heavily correlated stats
                if (s1.marketName === 'Total Match Score' && s2.marketName === 'Total Match Score') return true // Obvious conflict

                // Cannot combine multiple winners (e.g. Winner A and Winner B)
                if (s1.marketName === 'Match Winner' && s2.marketName === 'Match Winner') return true

                // Cannot combine Bulls Over and Match Total Over loosely
                if (s1.marketName === 'Total Bulls' && s2.marketName === 'Total Bulls') return true

                if (s1.marketName === 'Any Player Perfect Throw (180)' && s2.marketName === 'Any Player Perfect Throw (180)') return true
            }
        }
    }
    return false
}

export function evaluateQDartsBet(sel: VirtualSelection, outcome: QDartsMatchOutcome): boolean {
    if (sel.marketName === 'Match Winner') {
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

    if (sel.marketName === 'Total Bulls') {
        const parts = sel.selectionId.split('_')
        const type = parts[1]
        const band = parseFloat(parts[2])
        return type === 'over' ? outcome.totalBulls > band : outcome.totalBulls < band
    }

    if (sel.marketName === 'Any Player Perfect Throw (180)') {
        const type = sel.selectionId.replace('perfect_', '') // yes or no
        const hadPerfect = outcome.perfectThrowByA || outcome.perfectThrowByB
        return type === 'yes' ? hadPerfect : !hadPerfect
    }

    return false
}
