'use client'

import React, { useMemo } from 'react'
import { QMarblesRaceOutcome } from '@/lib/q-marbles-engine'
import { cn } from '@/lib/utils'

interface QMarblesLivePlayerProps {
    outcome: QMarblesRaceOutcome
    gameState: any
}

export function QMarblesLivePlayer({ outcome, gameState }: QMarblesLivePlayerProps) {
    const isInProgress = gameState.phase === 'IN_PROGRESS'
    const isSettlement = gameState.phase === 'SETTLEMENT'

    // Standing logic
    const timeElapsed = 30 - gameState.timeRemaining
    const currentStep = Math.min(outcome.snapshots.length - 1, Math.floor(timeElapsed / 0.75))
    const currentStepData = outcome.snapshots[currentStep]

    const standings = useMemo(() => {
        if (!isInProgress && !isSettlement) return outcome.marbles.map(m => ({ ...m, position: 0 }))
        if (!currentStepData) return outcome.marbles.map(m => ({ ...m, position: 0 }))
        
        return [...currentStepData]
            .sort((a, b) => b.position - a.position)
            .map(snap => {
                const marble = outcome.marbles.find(m => m.id === snap.marbleId)!
                return { ...marble, position: snap.position }
            })
    }, [currentStepData, outcome.marbles, isInProgress, isSettlement])

    return (
        <div className="w-full bg-slate-900 shadow-2xl p-4 flex flex-col gap-4 border-b border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest leading-none">Live Standings</h2>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">University Marble Cup</span>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                         {isInProgress ? "Racing" : isSettlement ? "Finished" : "Waiting"}
                     </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {standings.map((marble, idx) => (
                    <div 
                        key={marble.id} 
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-xl border transition-all duration-300",
                            idx === 0 ? "bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-slate-800/50 border-white/5"
                        )}
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: marble.color }} />
                            <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-[8px] font-black">
                                {idx + 1}
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase truncate">{marble.shortName}</span>
                            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                <div 
                                    className="h-full transition-all duration-500 ease-out" 
                                    style={{ width: `${Math.min(100, marble.position)}%`, backgroundColor: marble.color }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
