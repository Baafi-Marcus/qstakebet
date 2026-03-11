'use client'

import React, { useMemo } from 'react'
import { QMarblesRaceOutcome } from '@/lib/q-marbles-engine'
import { cn } from '@/lib/utils'

interface QMarblesTrackProps {
    outcome: QMarblesRaceOutcome
    gameState: any
}

export function QMarblesTrack({ outcome, gameState }: QMarblesTrackProps) {
    const isInProgress = gameState.phase === 'IN_PROGRESS'
    const isSettlement = gameState.phase === 'SETTLEMENT'

    // We have 30 seconds for IN_PROGRESS.
    // engine has 40 snapshots. 30s / 40 steps = 0.75s per step.
    const timeElapsed = 30 - gameState.timeRemaining
    const currentStep = Math.min(outcome.snapshots.length - 1, Math.floor(timeElapsed / 0.75))
    
    const currentStepData = outcome.snapshots[currentStep]

    if (!isInProgress && !isSettlement) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                 <div className="text-center z-10">
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Waiting for Runners</div>
                 </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-slate-900/30 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col p-4 gap-2">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asphalt.png')] opacity-20 pointer-events-none" />
            
            {/* Lane Lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-full h-[1px] bg-white/5 border-t border-dashed border-white/10" />
                ))}
            </div>

            {/* Finish Line */}
            <div className="absolute right-12 top-0 bottom-0 w-2 bg-gradient-to-r from-transparent via-white/20 to-transparent flex flex-col justify-between py-2 z-10">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className={cn("w-full h-2", i % 2 === 0 ? "bg-white" : "bg-black")} />
                ))}
            </div>

            {/* The Marbles */}
            <div className="flex-1 flex flex-col justify-between relative py-2">
                {outcome.marbles.map((marble, idx) => {
                    const snap = currentStepData.find(s => s.marbleId === marble.id)
                    const pos = snap ? snap.position : 0
                    
                    return (
                        <div key={marble.id} className="relative h-8 flex items-center">
                            {/* Trace path */}
                            <div 
                                className="absolute left-0 h-1 rounded-full opacity-20 transition-all duration-300" 
                                style={{ width: `${pos}%`, backgroundColor: marble.color }}
                            />
                            
                            {/* The Marble */}
                            <div 
                                className="absolute transition-all duration-700 ease-linear flex items-center gap-3 z-20"
                                style={{ left: `calc(${pos}% - 24px)` }}
                            >
                                <div className="flex flex-col items-end">
                                     <span className="text-[7px] font-black uppercase text-white/40 leading-none mb-0.5">{marble.shortName}</span>
                                     <div className="w-6 h-6 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] border-2 border-white/20 relative overflow-hidden" style={{ backgroundColor: marble.color }}>
                                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent" />
                                         <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-60" />
                                     </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Photo Finish Indicator */}
            {isSettlement && outcome.isPhotoFinish && (
                <div className="absolute top-4 right-4 z-30 bg-amber-500/90 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase animate-bounce">
                    Photo Finish!
                </div>
            )}
        </div>
    )
}
