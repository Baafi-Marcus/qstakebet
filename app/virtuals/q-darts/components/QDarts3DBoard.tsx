import React from 'react'
import { QDartsMatchOutcome } from '@/lib/q-darts-engine'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QDarts3DBoardProps {
    outcome: QDartsMatchOutcome
    timeRemaining: number
    phase: string
}

export function QDarts3DBoard({ outcome, timeRemaining, phase }: QDarts3DBoardProps) {
    const isPlaying = phase === 'IN_PROGRESS'
    const isSettlement = phase === 'SETTLEMENT'

    // We recreate the same logic for determining active throw as the LivePlayer
    // But this focuses visually on the board.
    const elapsed = 25 - timeRemaining
    const rawExpectedIdx = Math.floor((elapsed / 25) * 30)
    const activeThrowIdx = isPlaying ? Math.max(-1, Math.min(29, rawExpectedIdx)) : -1

    // Get the sequence of throws
    const throwsToPlay = outcome.rounds.flatMap((r, rIdx) => {
        const sequence = []
        for (let t = 0; t < 3; t++) {
            sequence.push({ player: 'A', throw: r.playerAThrows[t], round: rIdx + 1 })
            sequence.push({ player: 'B', throw: r.playerBThrows[t], round: rIdx + 1 })
        }
        return sequence
    })

    const activeThrow = activeThrowIdx >= 0 ? throwsToPlay[activeThrowIdx] : null

    // Determine position based on score (mock visualization)
    const getPosForScore = (score: number, isBull: boolean) => {
        if (isBull) return { top: '50%', left: '50%' }
        if (score > 40) return { top: '30%', left: '70%' }
        if (score > 20) return { top: '70%', left: '30%' }
        return { top: '40%', left: '40%' }
    }

    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
            {/* 3D Board Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #8b5cf6 0%, transparent 60%)' }} />

            <div className="relative w-64 h-64 md:w-96 md:h-96 rounded-full border-8 border-slate-800 bg-[radial-gradient(circle_at_center,#1e293b_0%,#0f172a_100%)] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                {/* Rings */}
                <div className="absolute w-[80%] h-[80%] rounded-full border-2 border-white/10" />
                <div className="absolute w-[60%] h-[60%] rounded-full border-4 border-red-500/20" />
                <div className="absolute w-[40%] h-[40%] rounded-full border-2 border-white/10" />
                <div className="absolute w-[20%] h-[20%] rounded-full border-4 border-green-500/30" />

                {/* Bullseye */}
                <div className="absolute w-8 h-8 rounded-full bg-red-600 border-2 border-yellow-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white/50" />
                </div>

                {/* Animated Dart Hit */}
                {isPlaying && activeThrow && (
                    <div
                        key={`throw-${activeThrowIdx}`}
                        className={cn(
                            "absolute w-4 h-4 rounded-full shadow-[0_0_20px_4px] animate-in zoom-in spin-in-12 duration-300 z-20",
                            activeThrow.throw.isBullseye ? "bg-yellow-400 shadow-yellow-500/50" :
                                activeThrow.player === 'A' ? "bg-purple-500 shadow-purple-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                        )}
                        style={getPosForScore(activeThrow.throw.score, activeThrow.throw.isBullseye)}
                    />
                )}
            </div>

            {/* Overlays */}
            {isPlaying && activeThrow && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-center animate-pulse">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{activeThrow.player === 'A' ? outcome.playerA.name : outcome.playerB.name} just threw</p>
                    <p className={cn(
                        "text-2xl font-black italic",
                        activeThrow.throw.isBullseye ? "text-yellow-400" : "text-white"
                    )}>
                        {activeThrow.throw.isBullseye ? "BULLSEYE!" : `${activeThrow.throw.score} Points`}
                    </p>
                </div>
            )}

            {isSettlement && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                    <h2 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-2xl mb-4">MATCH OVER</h2>
                    <p className="text-xl text-slate-300 font-bold">{outcome.playerA.name} <span className="text-purple-400">{outcome.totalScoreA}</span> - <span className="text-emerald-400">{outcome.totalScoreB}</span> {outcome.playerB.name}</p>
                </div>
            )}
        </div>
    )
}
