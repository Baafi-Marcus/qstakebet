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
    'BETTING_OPEN': 30, // Reduced
    'BETTING_LOCKED': 5,
    'IN_PROGRESS': 30,
    'SETTLEMENT': 5,
    'RESET': 5
}

export function useQMarblesMatchLoop() {
    const TOTAL_CYCLE = 30 + 5 + 30 + 5 + 5 // 75 seconds
    const EPOCH = 1735689600000
    const SEED_BASE = 999111

    const calculateState = (): QMarblesMatchState => {
        const now = Date.now()
        const elapsedSinceEpoch = (now - EPOCH) / 1000
        const totalCyclesElapsed = Math.floor(elapsedSinceEpoch / TOTAL_CYCLE)
        const secondInRound = elapsedSinceEpoch % TOTAL_CYCLE

        let phase: QMarblesPhase = 'BETTING_OPEN'
        let timeRemaining = 0

        if (secondInRound < 30) {
            phase = 'BETTING_OPEN'
            timeRemaining = Math.ceil(30 - secondInRound)
        } else if (secondInRound < 35) {
            phase = 'BETTING_LOCKED'
            timeRemaining = Math.ceil(35 - secondInRound)
        } else if (secondInRound < 65) {
            phase = 'IN_PROGRESS'
            timeRemaining = Math.ceil(65 - secondInRound)
        } else if (secondInRound < 70) {
            phase = 'SETTLEMENT'
            timeRemaining = Math.ceil(70 - secondInRound)
        } else {
            phase = 'RESET'
            timeRemaining = Math.ceil(75 - secondInRound)
        }

        return {
            phase,
            timeRemaining,
            matchSeed: (SEED_BASE + totalCyclesElapsed * 888) % 1000000,
            roundId: totalCyclesElapsed + 1,
            timestamp: EPOCH + (totalCyclesElapsed * TOTAL_CYCLE * 1000)
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
