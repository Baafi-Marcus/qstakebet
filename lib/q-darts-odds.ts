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
    const skillSkew = (sA + sB) / 2

    // Base Win Prob (adjusted by skill difference)
    const totalS = sA + sB
    const probA_raw = sA / totalS
    const probB_raw = sB / totalS

    // 1. MATCH WINNER (Include DRAW)
    const probDraw = 0.10 // 10% base chance for a tie in total points over 5 rounds
    const adjProbA = probA_raw * (1 - probDraw)
    const adjProbB = probB_raw * (1 - probDraw)

    const marginWinner = 0.15
    const oddsWinnerA = calculateOddsFromProbability(adjProbA, marginWinner, outcome.timestamp, 1.08, 50.00) || 1.10
    const oddsWinnerB = calculateOddsFromProbability(adjProbB, marginWinner, outcome.timestamp + 1, 1.08, 50.00) || 1.10
    const oddsDraw = calculateOddsFromProbability(probDraw, marginWinner, outcome.timestamp + 2, 1.08, 50.00) || 8.00

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
    // Add jitter to bands based on seed
    const jitter = (outcome.timestamp % 100) - 50 
    const bands = [
        Math.floor(projectedTotal * 0.7 + jitter) + 0.5,
        Math.floor(projectedTotal * 0.85 + jitter) + 0.5,
        Math.floor(projectedTotal * 1.0 + jitter) + 0.5,
        Math.floor(projectedTotal * 1.15 + jitter) + 0.5
    ]

    const totalSelections: any[] = []
    bands.forEach((band, idx) => {
        // Skew probability based on skill (favorites likely to go over)
        const spread = projectedTotal - band
        const pOver = 1 / (1 + Math.exp(-spread / (100 / skillSkew)))
        
        if (pOver > 0.02 && pOver < 0.98) {
            totalSelections.push({ 
                id: `total_over_${band}`, 
                label: `Over ${band}`, 
                odds: calculatePropOdds(pOver, 0.05 + idx * 0.02, marginTotal, 1.08, 50.00, outcome.timestamp + 100 + idx) || 1.10, 
                probability: pOver,
                band // Helper for sorting
            })
            totalSelections.push({ 
                id: `total_under_${band}`, 
                label: `Under ${band}`, 
                odds: calculatePropOdds(1 - pOver, 0.05 + idx * 0.02, marginTotal, 1.08, 50.00, outcome.timestamp + 200 + idx) || 1.10, 
                probability: 1 - pOver,
                band // Helper for sorting
            })
        }
    })

    // Monotonic Correction for Total Match Score
    if (totalSelections.length > 0) {
        // Over: higher band -> higher odds
        const overs = totalSelections.filter(s => s.id.includes('_over_')).sort((a, b) => a.band - b.band)
        for (let i = 1; i < overs.length; i++) {
            overs[i].odds = Math.max(overs[i].odds, overs[i-1].odds + 0.02)
        }
        // Under: lower band -> higher odds (e.g. Under 400.5 is harder than Under 600.5)
        const unders = totalSelections.filter(s => s.id.includes('_under_')).sort((a, b) => a.band - b.band)
        for (let i = unders.length - 2; i >= 0; i--) {
            unders[i].odds = Math.max(unders[i].odds, unders[i+1].odds + 0.02)
        }
    }

    if (totalSelections.length > 0) {
        markets.push({
            id: 'total_score',
            name: 'Total Match Score',
            description: 'Total combined score of both players at the end of 5 rounds.',
            selections: totalSelections.map(({ band, ...rest }) => rest)
        })
    }

    // 2.5 INDIVIDUAL PLAYER TOTALS (New)
    [pA, pB].forEach(player => {
        const skill = skillMap[player.skill]
        const proj = skill * 5 * 105
        const pBands = [
            Math.floor(proj * 0.85 + jitter/10) + 0.5,
            Math.floor(proj * 1.0 + jitter/10) + 0.5,
            Math.floor(proj * 1.15 + jitter/10) + 0.5
        ]
        const pSells: any[] = []
        pBands.forEach((band, idx) => {
            const pOver = 1 / (1 + Math.exp(-(proj - band) / (50 / skill)))
            if (pOver > 0.02 && pOver < 0.98) {
                pSells.push({ id: `${player.id}_total_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pOver, 0.1, marginTotal, 1.08, 50.00, outcome.timestamp + 500 + idx) || 1.85, probability: pOver, band })
                pSells.push({ id: `${player.id}_total_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pOver, 0.1, marginTotal, 1.08, 50.00, outcome.timestamp + 600 + idx) || 1.85, probability: 1 - pOver, band })
            }
        })
        
        // Monotonic Correction
        const overs = pSells.filter(s => s.id.includes('_over_')).sort((a, b) => a.band - b.band)
        for (let i = 1; i < overs.length; i++) overs[i].odds = Math.max(overs[i].odds, overs[i-1].odds + 0.02)
        const unders = pSells.filter(s => s.id.includes('_under_')).sort((a, b) => a.band - b.band)
        for (let i = unders.length - 2; i >= 0; i--) unders[i].odds = Math.max(unders[i].odds, unders[i+1].odds + 0.02)

        if (pSells.length > 0) {
            markets.push({
                id: `${player.id}_total_points`,
                name: `${player.name} Total Points`,
                description: `Total points scored by ${player.name} in the match.`,
                selections: pSells.map(({ band, ...rest }) => rest)
            })
        }
    })

    // 3. PER ROUND MARKETS
    for (let r = 1; r <= 5; r++) {
        const marginRound = 0.18
        // Round Winner - add jitter per round
        const rJitter = ((outcome.timestamp + r) % 10) / 100
        const pWinA = clamp(probA_raw + rJitter - 0.05, 0.1, 0.9)
        const pWinB = 1 - pWinA

        markets.push({
            id: `round_${r}_winner`,
            name: `Round ${r} Winner`,
            description: `Which player will score more points in Round ${r}?`,
            selections: [
                { id: `round_${r}_winner_A`, label: pA.name, odds: calculateOddsFromProbability(pWinA, marginRound, outcome.timestamp + r * 10, 1.08, 50.00) || 1.80, probability: pWinA },
                { id: `round_${r}_winner_B`, label: pB.name, odds: calculateOddsFromProbability(pWinB, marginRound, outcome.timestamp + r * 10 + 1, 1.08, 50.00) || 1.80, probability: pWinB }
            ]
        })

        // Round Score O/U - EXPANDED TO MULTIPLE BANDS
        const projRound = (sA + sB) * 105
        const roundSeels: any[] = []
        const rBands = [
            Math.floor(projRound * 0.8 + jitter/5) + 0.5,
            Math.floor(projRound * 1.0 + jitter/5) + 0.5,
            Math.floor(projRound * 1.2 + jitter/5) + 0.5
        ]

        rBands.forEach((band, bIdx) => {
            const rDiff = projRound - band
            const pROver = 1 / (1 + Math.exp(-rDiff / (40 / skillSkew)))
            if (pROver > 0.02 && pROver < 0.98) {
                roundSeels.push({ id: `round_${r}_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pROver, 0.1, marginRound, 1.08, 50.00, outcome.timestamp + r * 50 + bIdx) || 1.85, probability: pROver, band })
                roundSeels.push({ id: `round_${r}_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pROver, 0.1, marginRound, 1.08, 50.00, outcome.timestamp + r * 60 + bIdx) || 1.85, probability: 1 - pROver, band })
            }
        })

        // Monotonic Correction
        const overs = roundSeels.filter(s => s.id.includes('_over_')).sort((a, b) => a.band - b.band)
        for (let i = 1; i < overs.length; i++) overs[i].odds = Math.max(overs[i].odds, overs[i-1].odds + 0.02)
        const unders = roundSeels.filter(s => s.id.includes('_under_')).sort((a, b) => a.band - b.band)
        for (let i = unders.length - 2; i >= 0; i--) unders[i].odds = Math.max(unders[i].odds, unders[i+1].odds + 0.02)

        markets.push({
            id: `round_${r}_total`,
            name: `Round ${r} Points`,
            description: `Total points scored by both players in Round ${r}.`,
            selections: roundSeels.map(({ band, ...rest }) => rest)
        })
    }

    // 4. PROPS
    const marginProps = 0.22

    // Any Bullseye - skew heavily by skill and add jitter
    const bullJitter = ((outcome.timestamp % 15) / 100)
    const pAnyBull = clamp(((sA + sB) * 0.35) + bullJitter, 0.15, 0.85)
    
    markets.push({
        id: 'any_bullseye',
        name: 'Any Bullseye in Match',
        description: 'Will any player hit a Bullseye (25 or 50) during the match?',
        selections: [
            { id: 'any_bull_yes', label: 'Yes', odds: calculatePropOdds(pAnyBull, 0.05, marginProps, 1.08, 50.00, outcome.timestamp + 77) || 1.5, probability: pAnyBull },
            { id: 'any_bull_no', label: 'No', odds: calculatePropOdds(1 - pAnyBull, 0.05, marginProps, 1.08, 50.00, outcome.timestamp + 88) || 2.5, probability: 1 - pAnyBull }
        ]
    })

    // Total Triples - EXPANDED TO MULTIPLE BANDS
    const projTriples = (sA + sB) * 1.5
    const tripleSeels: any[] = []
    const tBands = [
        Math.floor(projTriples * 0.5 + jitter/50) + 0.5,
        Math.floor(projTriples * 1.0 + jitter/50) + 0.5,
        Math.floor(projTriples * 1.5 + jitter/50) + 0.5
    ].filter((v, i, a) => a.indexOf(v) === i) // unique only

    tBands.forEach((band, idx) => {
        const pTOver = 1 / (1 + Math.exp(-(projTriples - band) / (sA + sB)))
        if (pTOver > 0.02 && pTOver < 0.98) {
            tripleSeels.push({ id: `triples_over_${band}`, label: `Over ${band}`, odds: calculatePropOdds(pTOver, 0.1, marginProps, 1.08, 50.00, outcome.timestamp + 300 + idx) || 1.8, probability: pTOver, band })
            tripleSeels.push({ id: `triples_under_${band}`, label: `Under ${band}`, odds: calculatePropOdds(1 - pTOver, 0.1, marginProps, 1.08, 50.00, outcome.timestamp + 400 + idx) || 1.8, probability: 1 - pTOver, band })
        }
    })

    // Monotonic Correction
    const tOvers = tripleSeels.filter(s => s.id.includes('_over_')).sort((a, b) => a.band - b.band)
    for (let i = 1; i < tOvers.length; i++) tOvers[i].odds = Math.max(tOvers[i].odds, tOvers[i-1].odds + 0.02)
    const tUnders = tripleSeels.filter(s => s.id.includes('_under_')).sort((a, b) => a.band - b.band)
    for (let i = tUnders.length - 2; i >= 0; i--) tUnders[i].odds = Math.max(tUnders[i].odds, tUnders[i+1].odds + 0.02)
    
    markets.push({
        id: 'total_triples',
        name: 'Total Triples',
        description: 'Combined number of triple rings hit by both players.',
        selections: tripleSeels.map(({ band, ...rest }) => rest)
    })

    // 5. PROPS: PERFECT THROW (180 - 3 Triple 20s in a round)
    // Extremely rare.
    const p180 = (sA + sB) * 0.05
    if (p180 >= 0.01 && p180 <= 0.80) {
        markets.push({
            id: 'perfect_throw',
            name: 'Any Player Perfect Throw (180)',
            description: 'Will any player score a maximum of 180 points (3 Triple 20s) in a single round?',
            selections: [
                { id: `perfect_yes`, label: 'Yes', odds: calculatePropOdds(p180, 0.0, marginProps, 1.08, 50.00, outcome.timestamp + 99) || 4.50, probability: p180 },
                { id: `perfect_no`, label: 'No', odds: calculatePropOdds(1 - p180, 0.0, marginProps, 1.01, 2.50, outcome.timestamp + 101) || 1.10, probability: 1 - p180 }
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

    if (sel.marketName.endsWith('Total Points')) {
        const isA = sel.marketName.startsWith(outcome.playerA.name)
        const isB = sel.marketName.startsWith(outcome.playerB.name)
        if (!isA && !isB) return false
        
        const score = isA ? outcome.totalScoreA : outcome.totalScoreB
        const parts = sel.selectionId.split('_')
        const band = parseFloat(parts[parts.length - 1])
        return sel.selectionId.includes('_over_') ? score > band : score < band
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
