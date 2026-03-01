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
    const getPosForThrow = (t: any, idx: number) => {
        // Seeded randomness for position based on index to keep it consistent
        const s = (idx * 1337) % 100
        const angle = (idx * 45) % 360
        const dist = t.throw.isBullseye ? Math.min(5, (idx % 8)) : (20 + (idx % 60))

        if (t.throw.isBullseye) {
            return {
                top: `${50 + (Math.cos(angle) * (idx % 3))}%`,
                left: `${50 + (Math.sin(angle) * (idx % 3))}%`
            }
        }

        // Map scores to rings roughly
        const radius = t.throw.score > 40 ? 35 : (t.throw.score > 20 ? 65 : 85)
        const finalAngle = angle + (s % 20)

        return {
            top: `${50 + Math.cos(finalAngle * Math.PI / 180) * radius * 0.4}%`,
            left: `${50 + Math.sin(finalAngle * Math.PI / 180) * radius * 0.4}%`
        }
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
                <div className={cn(
                    "absolute w-8 h-8 rounded-full border-2 border-yellow-500 z-10 flex items-center justify-center transition-all duration-300",
                    activeThrow?.throw.isBullseye ? "bg-yellow-400 scale-125 shadow-[0_0_30px_rgba(250,204,21,0.8)]" : "bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )}>
                    <Target className={cn("w-4 h-4", activeThrow?.throw.isBullseye ? "text-red-600" : "text-white/50")} />
                </div>

                {/* Persistent Hit Markers */}
                {isPlaying && throwsToPlay.slice(0, activeThrowIdx + 1).map((t, idx) => (
                    <div
                        key={`hit-${idx}`}
                        className={cn(
                            "absolute w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 z-20",
                            t.throw.isBullseye ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" :
                                t.player === 'A' ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]",
                            idx === activeThrowIdx ? "scale-150 ring-4 ring-white animate-pulse z-30" : "opacity-80"
                        )}
                        style={getPosForThrow(t, idx)}
                    />
                ))}
            </div>

            {/* Overlays */}
            {isPlaying && activeThrow && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{activeThrow.player === 'A' ? outcome.playerA.name : outcome.playerB.name} just threw</p>
                    <p className={cn(
                        "text-2xl font-black italic",
                        activeThrow.throw.isBullseye ? "text-yellow-400" : "text-white"
                    )}>
                        {activeThrow.throw.isBullseye ? "BULLSEYE!" : (activeThrow.throw.score === 60 ? "TRIPLE 20!" : `${activeThrow.throw.score} Points`)}
                    </p>
                </div>
            )}

            {isSettlement && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in duration-500">
                    <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-widest drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] mb-4">MATCH OVER</h2>
                    <div className="flex items-center gap-8 bg-slate-900/80 p-6 rounded-3xl border border-white/10 shadow-2xl">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">{outcome.playerA.name}</p>
                            <p className="text-4xl font-black text-purple-400">{outcome.totalScoreA}</p>
                        </div>
                        <div className="h-12 w-px bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">{outcome.playerB.name}</p>
                            <p className="text-4xl font-black text-emerald-400">{outcome.totalScoreB}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
