'use client'

import React, { useEffect, useState, useRef } from 'react'
import { QDartsMatchOutcome, QDartsThrow } from '@/lib/q-darts-engine'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { Target } from 'lucide-react'

interface QDartsLivePlayerProps {
    outcome: QDartsMatchOutcome
    timeRemaining: number
    phase: string
}

export function QDartsLivePlayer({ outcome, timeRemaining, phase }: QDartsLivePlayerProps) {
    const isPlaying = phase === 'IN_PROGRESS'
    const isSettlement = phase === 'SETTLEMENT'

    // We have 25 seconds to play 5 rounds (3 darts per player per round = 6 throws)
    // 30 total throws. 25s / 30 = ~800ms per throw.
    const throwsToPlay = outcome.rounds.flatMap((r, rIdx) => {
        const sequence = []
        for (let t = 0; t < 3; t++) {
            sequence.push({ player: 'A', throw: r.playerAThrows[t], round: rIdx + 1 })
            sequence.push({ player: 'B', throw: r.playerBThrows[t], round: rIdx + 1 })
        }
        return sequence
    })

    // Active throw index based on elapsed time inside the 25s window
    const [activeThrowIdx, setActiveThrowIdx] = useState(-1)

    // Track cumulative scores live during animation
    const [liveScoreA, setLiveScoreA] = useState(0)
    const [liveScoreB, setLiveScoreB] = useState(0)
    const [currentRound, setCurrentRound] = useState(1)
    const [lastHit, setLastHit] = useState<{ player: string, score: number, isBull: boolean } | null>(null)

    useEffect(() => {
        if (!isPlaying) {
            if (isSettlement) {
                // Instantly sync to final state
                setLiveScoreA(outcome.totalScoreA)
                setLiveScoreB(outcome.totalScoreB)
                setCurrentRound(5)
                setActiveThrowIdx(throwsToPlay.length - 1)

                // Final win/loss vibration
                haptics.success() // Simple hit for now
            } else {
                // Reset for betting phase
                setLiveScoreA(0)
                setLiveScoreB(0)
                setCurrentRound(1)
                setActiveThrowIdx(-1)
                setLastHit(null)
            }
            return
        }

        // 25 seconds total. Time remaining counts down 25 -> 0.
        // Elapsed = 25 - timeRemaining
        const elapsed = 25 - timeRemaining
        // 30 throws total. Each throw takes 25/30 = 0.833s
        const expectedIdx = Math.floor(elapsed / (25 / 30))

        if (expectedIdx !== activeThrowIdx && expectedIdx >= 0 && expectedIdx < throwsToPlay.length) {
            setActiveThrowIdx(expectedIdx)
            const currentThrow = throwsToPlay[expectedIdx]

            // Update live scores
            if (currentThrow.player === 'A') setLiveScoreA(prev => prev + currentThrow.throw.score)
            else setLiveScoreB(prev => prev + currentThrow.throw.score)

            setCurrentRound(currentThrow.round)
            setLastHit({
                player: currentThrow.player === 'A' ? outcome.playerA.name : outcome.playerB.name,
                score: currentThrow.throw.score,
                isBull: currentThrow.throw.isBullseye
            })

            // Haptics per throw
            if (currentThrow.throw.isBullseye) haptics.medium()
            else haptics.light()
        }

    }, [timeRemaining, isPlaying, isSettlement])

    const pA = outcome.playerA
    const pB = outcome.playerB

    return (
        <div className="w-full h-48 md:h-64 bg-slate-900 border-b border-white/5 relative overflow-hidden flex flex-col justify-between">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            </div>

            {/* Status Bar */}
            <div className="relative z-10 flex justify-between items-center px-4 py-2 bg-slate-950/50 border-b border-white/5">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                    {isPlaying ? `Round ${currentRound} of 5` : isSettlement ? 'Final Result' : 'Match Preview'}
                </span>
                {isPlaying && (
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={cn("h-1 w-4 rounded-full transition-all duration-300",
                                i + 1 === currentRound ? "bg-purple-500 animate-pulse" :
                                    i + 1 < currentRound ? "bg-slate-700" : "bg-white/10"
                            )} />
                        ))}
                    </div>
                )}
            </div>

            {/* Central Play Area - The Hybrid View */}
            <div className="flex-1 relative z-10 flex items-center justify-between px-4 md:px-12">

                {/* Player A Stats */}
                <div className="flex flex-col items-start w-1/3">
                    <span className="text-xs md:text-sm font-black uppercase tracking-widest text-white/50">{pA.name}</span>
                    <span className="text-4xl md:text-6xl font-black font-mono transition-all duration-300"
                        style={{ color: pA.color, textShadow: `0 0 20px ${pA.color}40` }}>
                        {liveScoreA}
                    </span>
                    {isSettlement && outcome.matchWinner === 'A' && (
                        <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest mt-1 animate-bounce">Winner</span>
                    )}
                </div>

                {/* Center Action (Ticker / Mini Dartboard) */}
                <div className="flex flex-col items-center justify-center flex-1 mx-4">
                    {isPlaying ? (
                        <div className="text-center animate-in slide-in-from-bottom-2 duration-200" key={activeThrowIdx}>
                            {lastHit && (
                                <>
                                    <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">{lastHit.player} Hit</div>
                                    <div className={cn(
                                        "text-4xl font-black italic tracking-tighter drop-shadow-md",
                                        lastHit.isBull ? "text-yellow-400 scale-125" : "text-white"
                                    )}>
                                        {lastHit.isBull ? "BULL!" : lastHit.score}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : isSettlement ? (
                        <div className="flex flex-col items-center justify-center">
                            <Target className="w-12 h-12 text-slate-700 mb-2 opacity-50" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Match Complete</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <Target className="w-12 h-12 text-slate-700 mb-2 opacity-50 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waiting for bets...</span>
                        </div>
                    )}
                </div>

                {/* Player B Stats */}
                <div className="flex flex-col items-end w-1/3">
                    <span className="text-xs md:text-sm font-black uppercase tracking-widest text-white/50">{pB.name}</span>
                    <span className="text-4xl md:text-6xl font-black font-mono transition-all duration-300"
                        style={{ color: pB.color, textShadow: `0 0 20px ${pB.color}40` }}>
                        {liveScoreB}
                    </span>
                    {isSettlement && outcome.matchWinner === 'B' && (
                        <span className="text-[9px] uppercase font-black text-emerald-400 tracking-widest mt-1 animate-bounce">Winner</span>
                    )}
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="h-1 w-full bg-slate-950">
                <div className="h-full bg-purple-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${isPlaying ? ((25 - timeRemaining) / 25) * 100 : isSettlement ? 100 : 0}%` }} />
            </div>

        </div>
    )
}
