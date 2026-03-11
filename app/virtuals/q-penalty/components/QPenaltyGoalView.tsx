'use client'

import React, { useMemo } from 'react'
import { QPenaltyMatchOutcome } from '@/lib/q-penalty-engine'
import { cn } from '@/lib/utils'

interface QPenaltyGoalViewProps {
    outcome: QPenaltyMatchOutcome
    gameState: any 
}

export function QPenaltyGoalView({ outcome, gameState }: QPenaltyGoalViewProps) {
    const isInProgress = gameState.phase === 'IN_PROGRESS'
    const isSettlement = gameState.phase === 'SETTLEMENT'

    // Timing logic (3 seconds per attempt)
    const timeElapsed = 30 - gameState.timeRemaining
    const currentAttemptIdx = Math.floor(timeElapsed / 3) 
    const attemptTime = timeElapsed % 3 // 0 to 3 seconds

    const isPlayerBTurn = currentAttemptIdx % 2 !== 0
    const currentRound = Math.floor(currentAttemptIdx / 2)
    
    const currentAttempt = useMemo(() => {
        if (!isInProgress) return null
        return isPlayerBTurn ? outcome.attemptsB[currentRound] : outcome.attemptsA[currentRound]
    }, [isInProgress, isPlayerBTurn, currentRound, outcome])

    // Animation phases
    // 0.0 - 1.0: Preparation / Idle
    // 1.0 - 1.2: Kicking action
    // 1.2 - 1.5: Ball in flight & Goalie Dive
    // 1.5 - 3.0: Result / Celebration / Reset
    
    const isKicking = attemptTime > 1.0 && attemptTime < 1.3
    const isFlying = attemptTime >= 1.2 && attemptTime < 1.6
    const isFinished = attemptTime >= 1.6

    const getGoaliePos = (dir: string) => {
        if (!isFlying && !isFinished) return 'translate-x-0'
        switch (dir) {
            case 'left': return '-translate-x-24 rotate-[-45deg]'
            case 'right': return 'translate-x-24 rotate-[45deg]'
            default: return 'translate-y-4' // slight crouch center
        }
    }

    const getBallPos = (dir: string) => {
        if (!isFlying && !isFinished) return 'translate-y-32 scale-150'
        switch (dir) {
            case 'left': return '-translate-x-28 -translate-y-24 scale-50'
            case 'right': return 'translate-x-28 -translate-y-24 scale-50'
            default: return '-translate-y-28 scale-50' // center
        }
    }

    if (!isInProgress) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                 <div className="w-64 h-32 border-4 border-white/5 rounded-t-lg relative">
                    <div className="absolute inset-0 bg-slate-900/50" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                     {isSettlement ? "Match Finished" : "Ready for Kickoff"}
                 </span>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-end pb-8">
            {/* The Goal */}
            <div className="w-80 h-40 border-t-8 border-x-8 border-white bg-slate-800/20 rounded-t-sm relative shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                {/* Net Details */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-20" />
                
                {/* The Goalkeeper */}
                <div 
                    className={cn(
                        "absolute bottom-0 left-1/2 -ml-6 w-12 h-20 bg-emerald-500 rounded-full transition-all duration-300 ease-out border-2 border-white/20 origin-bottom",
                        currentAttempt ? getGoaliePos(currentAttempt.goalieDirection) : "translate-x-0"
                    )}
                >
                    <div className="w-8 h-8 rounded-full bg-orange-200 mt-2 mx-auto" /> {/* Head */}
                </div>

                {/* The Ball */}
                <div 
                    className={cn(
                        "absolute left-1/2 -ml-3 bottom-0 w-6 h-6 bg-white rounded-full transition-all duration-500 ease-out shadow-xl z-20",
                        currentAttempt ? getBallPos(currentAttempt.direction) : "translate-y-32 scale-150"
                    )}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/football-no-lines.png')] opacity-40" />
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                 <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Kicker</span>
                 <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-black uppercase">
                     {isPlayerBTurn ? outcome.teamB.name : outcome.teamA.name}
                 </div>
            </div>

            {/* Result Toast */}
            {isFinished && (
                <div className="absolute inset-0 z-30 flex items-center justify-center animate-in zoom-in duration-300">
                    <div className={cn(
                        "text-6xl font-black uppercase italic tracking-tighter",
                        currentAttempt?.isScored ? "text-emerald-500" : "text-red-500"
                    )}>
                        {currentAttempt?.isScored ? "GOAL!" : "MISSED"}
                    </div>
                </div>
            )}
        </div>
    )
}
