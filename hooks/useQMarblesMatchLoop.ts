import { useState, useEffect, useMemo } from 'react'

export type QMarblesPhase = 'BETTING_OPEN' | 'BETTING_LOCKED' | 'IN_PROGRESS' | 'SETTLEMENT' | 'RESET'

export interface QMarblesMatchState {
    phase: QMarblesPhase
    timeRemaining: number 
    matchSeed: number     
    roundId: number       
    timestamp: number     
}

const PHASE_DURATIONS: Record<QMarblesPhase, number> = {
    'BETTING_OPEN': 60,
    'BETTING_LOCKED': 5,
    'IN_PROGRESS': 30,
    'SETTLEMENT': 5,
    'RESET': 5
}

export function useQMarblesMatchLoop() {
    const TOTAL_CYCLE = 60 + 5 + 30 + 5 + 5 // 105 seconds

    // Generate a session-specific start time and seed on mount
    const sessionData = useMemo(() => ({
        startTime: Date.now(),
        seedBase: Math.floor(Math.random() * 1000000)
    }), [])

    const calculateState = (): QMarblesMatchState => {
        const now = Date.now()
        const elapsedSinceStart = (now - sessionData.startTime) / 1000
        const totalCyclesElapsed = Math.floor(elapsedSinceStart / TOTAL_CYCLE)
        const secondInRound = elapsedSinceStart % TOTAL_CYCLE

        let phase: QMarblesPhase = 'BETTING_OPEN'
        let timeRemaining = 0

        if (secondInRound < 60) {
            phase = 'BETTING_OPEN'
            timeRemaining = Math.ceil(60 - secondInRound)
        } else if (secondInRound < 65) {
            phase = 'BETTING_LOCKED'
            timeRemaining = Math.ceil(65 - secondInRound)
        } else if (secondInRound < 95) {
            phase = 'IN_PROGRESS'
            timeRemaining = Math.ceil(95 - secondInRound)
        } else if (secondInRound < 100) {
            phase = 'SETTLEMENT'
            timeRemaining = Math.ceil(100 - secondInRound)
        } else {
            phase = 'RESET'
            timeRemaining = Math.ceil(105 - secondInRound)
        }

        return {
            phase,
            timeRemaining,
            matchSeed: (sessionData.seedBase + totalCyclesElapsed * 98765) % 1000000,
            roundId: totalCyclesElapsed + 1,
            timestamp: sessionData.startTime + (totalCyclesElapsed * TOTAL_CYCLE * 1000)
        }
    }

    const [state, setState] = useState<QMarblesMatchState>(calculateState())

    useEffect(() => {
        const timer = setInterval(() => {
            setState(calculateState())
        }, 500)

        return () => clearInterval(timer)
    }, [])

    return state
}
