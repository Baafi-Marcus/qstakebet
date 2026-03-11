import { useState, useEffect, useMemo } from 'react'

export type QPenaltyPhase = 'BETTING_OPEN' | 'BETTING_LOCKED' | 'IN_PROGRESS' | 'SETTLEMENT' | 'RESET'

export interface QPenaltyMatchState {
    phase: QPenaltyPhase
    timeRemaining: number 
    matchSeed: number     
    roundId: number       
    timestamp: number     
}

const PHASE_DURATIONS: Record<QPenaltyPhase, number> = {
    'BETTING_OPEN': 30, // Reduced from 60
    'BETTING_LOCKED': 5,
    'IN_PROGRESS': 30, 
    'SETTLEMENT': 5,
    'RESET': 5
}

export function useQPenaltyMatchLoop() {
    // 30 + 5 + 30 + 5 + 5 = 75 seconds
    const TOTAL_CYCLE = 30 + 5 + 30 + 5 + 5
    
    // Fixed Epoch: Jan 1st 2026 
    const EPOCH = 1735689600000 
    const SEED_BASE = 543210 // Fixed global seed base

    const calculateState = (): QPenaltyMatchState => {
        const now = Date.now()
        const elapsedSinceEpoch = (now - EPOCH) / 1000
        const totalCyclesElapsed = Math.floor(elapsedSinceEpoch / TOTAL_CYCLE)
        const secondInRound = elapsedSinceEpoch % TOTAL_CYCLE

        let phase: QPenaltyPhase = 'BETTING_OPEN'
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
            matchSeed: (SEED_BASE + totalCyclesElapsed * 777) % 1000000,
            roundId: totalCyclesElapsed + 1,
            timestamp: EPOCH + (totalCyclesElapsed * TOTAL_CYCLE * 1000)
        }
    }

    const [state, setState] = useState<QPenaltyMatchState>(calculateState())

    useEffect(() => {
        const timer = setInterval(() => {
            setState(calculateState())
        }, 500)

        return () => clearInterval(timer)
    }, [])

    return state
}
