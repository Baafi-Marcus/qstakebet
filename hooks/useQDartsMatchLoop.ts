import { useState, useEffect, useRef } from 'react'

export type QDartsPhase = 'BETTING_OPEN' | 'BETTING_LOCKED' | 'IN_PROGRESS' | 'SETTLEMENT' | 'RESET'

export interface QDartsMatchState {
    phase: QDartsPhase
    timeRemaining: number // seconds remaining in CURRENT phase
    matchSeed: number     // deterministic seed for the current match
    roundId: number       // overall epoch counter
    timestamp: number     // stable unix timestamp for this round
}

const PHASE_DURATIONS: Record<QDartsPhase, number> = {
    'BETTING_OPEN': 60,
    'BETTING_LOCKED': 5,
    'IN_PROGRESS': 25,
    'SETTLEMENT': 5,
    'RESET': 5
}

export function useQDartsMatchLoop() {
    const TOTAL_CYCLE = 60 + 5 + 25 + 5 + 5 // 100 seconds

    const calculateState = (): QDartsMatchState => {
        const now = Date.now()
        const totalSeconds = Math.floor(now / 1000)
        const roundId = Math.floor(totalSeconds / TOTAL_CYCLE)
        const secondInRound = totalSeconds % TOTAL_CYCLE

        let phase: QDartsPhase = 'BETTING_OPEN'
        let timeRemaining = 0

        if (secondInRound < 60) {
            phase = 'BETTING_OPEN'
            timeRemaining = 60 - secondInRound
        } else if (secondInRound < 65) {
            phase = 'BETTING_LOCKED'
            timeRemaining = 65 - secondInRound
        } else if (secondInRound < 90) {
            phase = 'IN_PROGRESS'
            timeRemaining = 90 - secondInRound
        } else if (secondInRound < 95) {
            phase = 'SETTLEMENT'
            timeRemaining = 95 - secondInRound
        } else {
            phase = 'RESET'
            timeRemaining = 100 - secondInRound
        }

        return {
            phase,
            timeRemaining,
            matchSeed: (roundId * 12345) % 1000000,
            roundId,
            timestamp: (roundId * TOTAL_CYCLE) * 1000 // Stable start time of the round
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
