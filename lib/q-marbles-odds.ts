import { QMarblesRaceOutcome } from "./q-marbles-engine"
import { VirtualSelection } from "./virtuals"

export interface QMarblesSelection {
    id: string
    label: string
    odds: number
}

export interface QMarblesMarket {
    id: string
    name: string
    description: string
    selections: QMarblesSelection[]
}

export function generateQMarblesMarkets(outcome: QMarblesRaceOutcome): QMarblesMarket[] {
    const markets: QMarblesMarket[] = []

    // 1. Race Winner - Target ~15-20% margin for 4 marbles
    markets.push({
        id: 'winner',
        name: 'Winner',
        description: 'Predict the winner of the marble race.',
        selections: outcome.marbles.map(m => ({
            id: `win-${m.id}`,
            label: m.shortName,
            odds: 3.0 + (seededRandom(outcome.timestamp + m.id.length) * 0.5) // 3.0 to 3.5
        }))
    })

    // 2. Place (Top 3)
    markets.push({
        id: 'place',
        name: 'Place (Top 3)',
        description: 'Predict if a marble will finish in the Top 3.',
        selections: outcome.marbles.map(m => ({
            id: `place-${m.id}`,
            label: m.shortName,
            odds: 1.25 + (seededRandom(outcome.timestamp + m.id.length * 2) * 0.15)
        }))
    })

    // 3. Forecast (Top 2 Exact)
    const tops = outcome.marbles.slice(0, 3)
    const forecastSelections: QMarblesSelection[] = []
    for (let i = 0; i < tops.length; i++) {
        for (let j = 0; j < tops.length; j++) {
            if (i === j) continue
            forecastSelections.push({
                id: `fc-${tops[i].id}-${tops[j].id}`,
                label: `${tops[i].shortName} > ${tops[j].shortName}`,
                odds: 6.0 + (seededRandom(outcome.timestamp + i + j) * 4) // 6.0 to 10.0
            })
        }
    }
    markets.push({
        id: 'forecast',
        name: 'Forecast (Top 2)',
        description: 'Predict finishing order of 1st and 2nd.',
        selections: forecastSelections
    })

    // 4. Odd/Even Winner
    markets.push({
        id: 'odd-even',
        name: 'Marble Index',
        description: 'Predict if the winning marble has an odd or even index.',
        selections: [
            { id: 'odd', label: 'Odd Index', odds: 1.75 },
            { id: 'even', label: 'Even Index', odds: 1.75 }
        ]
    })

    return markets
}

export function evaluateQMarblesBet(selection: VirtualSelection, outcome: QMarblesRaceOutcome): boolean {
    const { selectionId } = selection

    if (selectionId.startsWith('win-')) {
        const id = selectionId.replace('win-', '')
        return outcome.winner === id
    }

    if (selectionId.startsWith('place-')) {
        const id = selectionId.replace('place-', '')
        return outcome.top3.includes(id as any)
    }

    if (selectionId.startsWith('fc-')) {
        const parts = selectionId.replace('fc-', '').split('-')
        return outcome.finishOrder[0] === parts[0] && outcome.finishOrder[1] === parts[1]
    }

    if (selectionId === 'odd') return outcome.oddWinner
    if (selectionId === 'even') return !outcome.oddWinner

    return false
}

function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
}
