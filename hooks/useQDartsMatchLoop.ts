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

export function useQDartsMatchLoop(initialSeed: number) {
    const [state, setState] = useState<QDartsMatchState>({
        phase: 'BETTING_OPEN',
        timeRemaining: PHASE_DURATIONS['BETTING_OPEN'],
        matchSeed: initialSeed,
        roundId: 1
    })

    const stateRef = useRef(state)
    stateRef.current = state

    useEffect(() => {
        const tickInterval = setInterval(() => {
            const current = stateRef.current
            let newTime = current.timeRemaining - 1
            let newPhase = current.phase
            let newSeed = current.matchSeed
            let newRound = current.roundId

            if (newTime <= 0) {
                // Transition phase
                switch (current.phase) {
                    case 'BETTING_OPEN':
                        newPhase = 'BETTING_LOCKED'
                        break
                    case 'BETTING_LOCKED':
                        newPhase = 'IN_PROGRESS'
                        break
                    case 'IN_PROGRESS':
                        newPhase = 'SETTLEMENT'
                        break
                    case 'SETTLEMENT':
                        newPhase = 'RESET'
                        break
                    case 'RESET':
                        newPhase = 'BETTING_OPEN'
                        newSeed = current.matchSeed + 1000 // deterministic jump
                        newRound = current.roundId + 1
                        break
                }
                newTime = PHASE_DURATIONS[newPhase]
            }

            setState({
                phase: newPhase,
                timeRemaining: newTime,
                matchSeed: newSeed,
                roundId: newRound
            })
        }, 1000)

        return () => clearInterval(tickInterval)
    }, [])

    return state
}
