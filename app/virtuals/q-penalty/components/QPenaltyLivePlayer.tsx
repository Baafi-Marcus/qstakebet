'use client'

import React from 'react'
import { QPenaltyMatchOutcome } from '@/lib/q-penalty-engine'
import { QPenaltyMatchState } from '@/hooks/useQPenaltyMatchLoop'
import { cn } from '@/lib/utils'

interface QPenaltyLivePlayerProps {
    outcome: QPenaltyMatchOutcome
    gameState: any // QPenaltyMatchState
}

export function QPenaltyLivePlayer({ outcome, gameState }: QPenaltyLivePlayerProps) {
    const isSettlement = gameState.phase === 'SETTLEMENT'
    const isInProgress = gameState.phase === 'IN_PROGRESS'

    // Calculate which round we are currently in based on timeElapsed
    // IN_PROGRESS is 30 seconds. 5 rounds = 6 sec per round (3 sec A, 3 sec B)
    const timeElapsed = 30 - gameState.timeRemaining
    const currentAttemptIdx = Math.floor(timeElapsed / 3) 
    const isPlayerBTurn = currentAttemptIdx % 2 !== 0
    const currentRound = Math.floor(currentAttemptIdx / 2) + 1

    return (
        <div className="w-full bg-slate-900 border-b border-white/5 p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                {/* Team A Scoreboard */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
                        {outcome.teamA.shortName}
                    </span>
                    <div className="text-3xl font-black">{outcome.scoreA}</div>
                    <div className="flex gap-1">
                        {outcome.attemptsA.slice(0, 5).map((att, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "w-3 h-3 rounded-full border border-white/10",
                                    (isInProgress && (currentAttemptIdx > i * 2 || (currentAttemptIdx === i * 2 && timeElapsed % 3 > 1.5))) || isSettlement
                                        ? (att.isScored ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")
                                        : "bg-slate-800"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* Match Info */}
                <div className="flex flex-col items-center">
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-2">
                         <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                             {isInProgress ? `Round ${Math.min(currentRound, 5)}` : isSettlement ? "Final Result" : "Upcoming"}
                         </span>
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shootout</div>
                </div>

                {/* Team B Scoreboard */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
                        {outcome.teamB.shortName}
                    </span>
                    <div className="text-3xl font-black">{outcome.scoreB}</div>
                    <div className="flex gap-1">
                        {outcome.attemptsB.slice(0, 5).map((att, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "w-3 h-3 rounded-full border border-white/10",
                                    (isInProgress && (currentAttemptIdx > (i * 2 + 1) || (currentAttemptIdx === (i * 2 + 1) && timeElapsed % 3 > 1.5))) || isSettlement
                                        ? (att.isScored ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")
                                        : "bg-slate-800"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Sudden Death / Banner */}
            {outcome.wentToSuddenDeath && (
                <div className="w-full h-8 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center animate-pulse">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Sudden Death In Progress</span>
                </div>
            )}
        </div>
    )
}
