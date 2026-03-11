import { QPenaltyMatchOutcome } from "./q-penalty-engine"
import { VirtualSelection } from "./virtuals"

export interface QPenaltySelection {
    id: string
    label: string
    odds: number
}

export interface QPenaltyMarket {
    id: string
    name: string
    description: string
    selections: QPenaltySelection[]
}

/**
 * Generate markets for a penalty shootout
 */
export function generateQPenaltyMarkets(outcome: QPenaltyMatchOutcome): QPenaltyMarket[] {
    const markets: QPenaltyMarket[] = []

    // 1. Match Winner (1X2)
    markets.push({
        id: '1x2',
        name: 'Match Winner',
        description: 'Predict the winner of the shootout.',
        selections: [
            { id: 'winner-a', label: outcome.teamA.shortName, odds: 1.85 },
            { id: 'winner-b', label: outcome.teamB.shortName, odds: 1.85 }
        ]
    })

    // 2. Total Goals (Over/Under)
    markets.push({
        id: 'total-goals',
        name: 'Total Goals',
        description: 'Total goals scored in the shootout.',
        selections: [
            { id: 'ov-5.5', label: 'Over 5.5', odds: 1.35 },
            { id: 'un-5.5', label: 'Under 5.5', odds: 2.40 },
            { id: 'ov-7.5', label: 'Over 7.5', odds: 1.90 },
            { id: 'un-7.5', label: 'Under 7.5', odds: 1.80 }
        ]
    })

    // 3. Both Teams to Score (BTTS)
    markets.push({
        id: 'btts',
        name: 'Both Scored First Round',
        description: 'Will both teams score their very first penalty?',
        selections: [
            { id: 'btts-yes', label: 'Yes', odds: 1.55 },
            { id: 'btts-no', label: 'No', odds: 2.25 }
        ]
    })

    // 4. Sudden Death
    markets.push({
        id: 'sudden-death',
        name: 'Sudden Death',
        description: 'Will the shootout go past the first 5 rounds?',
        selections: [
            { id: 'sd-yes', label: 'Yes', odds: 3.20 },
            { id: 'sd-no', label: 'No', odds: 1.25 }
        ]
    })

    // 5. First Team to Miss
    markets.push({
        id: 'first-miss',
        name: 'First to Miss',
        description: 'Which team will be the first to miss a penalty?',
        selections: [
            { id: 'miss-a', label: outcome.teamA.shortName, odds: 1.85 },
            { id: 'miss-b', label: outcome.teamB.shortName, odds: 1.85 }
        ]
    })

    return markets
}

/**
 * Evaluate if a bet selection won based on the outcome
 */
export function evaluateQPenaltyBet(selection: VirtualSelection, outcome: QPenaltyMatchOutcome): boolean {
    const { selectionId } = selection

    switch (selectionId) {
        case 'winner-a': return outcome.winner === 'A'
        case 'winner-b': return outcome.winner === 'B'
        
        case 'ov-5.5': return outcome.totalGoals > 5.5
        case 'un-5.5': return outcome.totalGoals < 5.5
        case 'ov-7.5': return outcome.totalGoals > 7.5
        case 'un-7.5': return outcome.totalGoals < 7.5

        case 'btts-yes': return outcome.bothTeamsScoredInFirstRound
        case 'btts-no': return !outcome.bothTeamsScoredInFirstRound

        case 'sd-yes': return outcome.wentToSuddenDeath
        case 'sd-no': return !outcome.wentToSuddenDeath

        case 'miss-a': return outcome.firstTeamToMiss === 'A'
        case 'miss-b': return outcome.firstTeamToMiss === 'B'

        default: return false
    }
}

/**
 * Check for correlated selections (preventing multiple markets from same match in some cases)
 * For Instant Virtuals, we usually allow accumulators BUT some markets might be too correlated.
 */
export function checkQPenaltyCorrelation(selections: VirtualSelection[]): boolean {
    // For now, allow all (most are distinct enough in a shootout)
    // One might argue "Sudden Death" and "Total Goals > 7.5" are correlated.
    return false 
}
