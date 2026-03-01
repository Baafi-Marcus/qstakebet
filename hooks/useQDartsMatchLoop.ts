import { useState, useEffect, useRef } from 'react'

export type QDartsPhase = 'BETTING_OPEN' | 'BETTING_LOCKED' | 'IN_PROGRESS' | 'SETTLEMENT' | 'RESET'

export interface QDartsMatchState {
    phase: QDartsPhase
    timeRemaining: number // seconds remaining in CURRENT phase
    matchSeed: number     // deterministic seed for the current match
    roundId: number       // overall epoch counter
}

const PHASE_DURATIONS: Record<QDartsPhase, number> = {
    'BETTING_OPEN': 22,
    'BETTING_LOCKED': 2,
    'IN_PROGRESS': 25,
    'SETTLEMENT': 3,
    'RESET': 3
}

export function useQDartsMatchLoop() {
    const TOTAL_CYCLE = 22 + 2 + 25 + 3 + 3 // 55 seconds

    const calculateState = (): QDartsMatchState => {
        const now = Date.now()
        const totalSeconds = Math.floor(now / 1000)
        const roundId = Math.floor(totalSeconds / TOTAL_CYCLE)
        const secondInRound = totalSeconds % TOTAL_CYCLE

        let phase: QDartsPhase = 'BETTING_OPEN'
        let timeRemaining = 0

        if (secondInRound < 22) {
            phase = 'BETTING_OPEN'
            timeRemaining = 22 - secondInRound
        } else if (secondInRound < 24) {
            phase = 'BETTING_LOCKED'
            timeRemaining = 24 - secondInRound
        } else if (secondInRound < 49) {
            phase = 'IN_PROGRESS'
            timeRemaining = 49 - secondInRound
        } else if (secondInRound < 52) {
            phase = 'SETTLEMENT'
            timeRemaining = 52 - secondInRound
        } else {
            phase = 'RESET'
            timeRemaining = 55 - secondInRound
        }

        return {
            phase,
            timeRemaining,
            matchSeed: (roundId * 12345) % 1000000, // Deterministic seed per round
            roundId
        }
    }

    const [state, setState] = useState<QDartsMatchState>(calculateState())

    useEffect(() => {
        const timer = setInterval(() => {
            setState(calculateState())
        }, 500) // Update more frequently to avoid lag

        return () => clearInterval(timer)
    }, [])

    return state
}
