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
    const isSettlement = gameState.phase === 'SET_SETTLEMENT' || gameState.phase === 'SETTLEMENT'

    const timeElapsed = 30 - gameState.timeRemaining
    const currentStep = Math.min(outcome.snapshots.length - 1, Math.floor(timeElapsed / 0.75))
    const currentStepData = outcome.snapshots[currentStep]

    // Define a winding SVG path for the marbles to follow
    // This is a "S" curve mimicking the reference image
    const trackPath = "M 50,350 C 150,350 250,50 400,50 C 550,50 650,350 750,350"
    
    // Sort marbles by position for the leaderboard
    const rankedMarbles = useMemo(() => {
        if (!currentStepData) return []
        return [...outcome.marbles].sort((a, b) => {
            const posA = currentStepData.find(s => s.marbleId === a.id)?.position || 0
            const posB = currentStepData.find(s => s.marbleId === b.id)?.position || 0
            return posB - posA
        })
    }, [currentStepData, outcome.marbles])

    if (!isInProgress && !isSettlement) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                 <div className="text-center z-10 p-8">
                      <div className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Race Starting Soon</div>
                      <div className="mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Prepare your bets</div>
                 </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-[#f8fafc] rounded-3xl border border-slate-200 relative overflow-hidden flex shadow-inner">
            {/* Environmental Background (Light themed like reference) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]" />

            {/* Sidebar Leaderboard (Matching Reference) */}
            <div className="w-40 h-full bg-slate-900/90 backdrop-blur-md z-30 flex flex-col border-r border-white/5 shadow-2xl">
                 <div className="p-3 border-b border-white/10 bg-black/20">
                      <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black italic text-white/40 tracking-tighter">03:45 +1 LAP</span>
                      </div>
                 </div>
                 <div className="flex-1 overflow-hidden py-1">
                      {rankedMarbles.map((m, i) => (
                          <div key={m.id} className={cn(
                              "flex items-center gap-2 px-3 py-1.5 transition-all duration-500",
                              i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                          )}>
                              <span className="text-[8px] font-black text-emerald-400 w-3">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                   <div className="text-[9px] font-black text-white truncate uppercase tracking-tighter">{m.shortName}</div>
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: m.color }} />
                          </div>
                      ))}
                 </div>
                 <div className="p-2 bg-emerald-600/10 border-t border-emerald-500/20">
                      <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest text-center">Live Tracking</div>
                 </div>
            </div>

            {/* Main Race Arena */}
            <div className="flex-1 relative p-4 overflow-hidden perspective-[1000px]">
                {/* 3D Track SVG */}
                <svg viewBox="0 0 800 400" className="w-full h-full drop-shadow-2xl translate-y-4 rotate-x-[20deg]">
                    <defs>
                        <mask id="trackMask">
                            <path d={trackPath} stroke="white" strokeWidth="60" fill="none" strokeLinecap="round" />
                        </mask>
                        <linearGradient id="trackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                    </defs>

                    {/* Track Bed/Curbs */}
                    <path d={trackPath} stroke="#cbd5e1" strokeWidth="68" fill="none" strokeLinecap="round" className="opacity-50" />
                    <path d={trackPath} stroke="#ef4444" strokeWidth="66" fill="none" strokeLinecap="round" strokeDasharray="10 20" />
                    <path d={trackPath} stroke="#ffffff" strokeWidth="66" fill="none" strokeLinecap="round" strokeDasharray="10 20" strokeDashoffset="15" />
                    
                    {/* Main Road */}
                    <path d={trackPath} stroke="url(#trackGrad)" strokeWidth="60" fill="none" strokeLinecap="round" id="racePath" />
                    
                    {/* Centered Dashed Line */}
                    <path d={trackPath} stroke="white" strokeWidth="1" fill="none" strokeDasharray="10 15" className="opacity-20" />

                    {/* Finish Line (at the end of path) */}
                    <g transform="translate(750, 350) rotate(-45)">
                        <rect x="-30" y="-5" width="60" height="10" fill="white" className="opacity-20" />
                    </g>

                    {/* Marbles on Track */}
                    {outcome.marbles.map((marble) => {
                        const snap = currentStepData.find(s => s.marbleId === marble.id)
                        const posPercent = snap ? snap.position / 100 : 0
                        
                        return (
                            <MarbleOnPath 
                                key={marble.id}
                                pathId="racePath"
                                percentage={posPercent}
                                color={marble.color}
                                name={marble.shortName}
                            />
                        )
                    })}
                </svg>

                {/* Photo Finish Indicator */}
                {isSettlement && outcome.isPhotoFinish && (
                    <div className="absolute top-4 right-4 z-30 bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-xl animate-bounce">
                        Photo Finish!
                    </div>
                )}
            </div>
        </div>
    )
}

function MarbleOnPath({ pathId, percentage, color, name }: { pathId: string, percentage: number, color: string, name: string }) {
    const [point, setPoint] = React.useState({ x: 0, y: 0 })
    const pathRef = React.useRef<SVGPathElement | null>(null)

    React.useEffect(() => {
        const path = document.getElementById(pathId) as SVGPathElement | null
        if (path) {
            const length = path.getTotalLength()
            const p = path.getPointAtLength(length * percentage)
            setPoint({ x: p.x, y: p.y })
        }
    }, [percentage, pathId])

    return (
        <g transform={`translate(${point.x}, ${point.y})`}>
            {/* Shadow */}
            <circle r="10" fill="black" className="opacity-20" transform="translate(4, 4)" />
            
            {/* Marble Body */}
            <defs>
                <radialGradient id={`grad-${name}`} cx="30%" cy="30%" r="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="60%" stopColor={color} />
                    <stop offset="100%" stopColor="black" stopOpacity="0.4" />
                </radialGradient>
            </defs>
            <circle r="8" fill={`url(#grad-${name})`} className="stroke-white/20 stroke-[0.5]" />
            
            {/* Inner Glow */}
            <circle r="3" cx="-2" cy="-2" fill="white" className="opacity-40" />
            
            {/* Name Tag (Small) */}
            <text y="-14" textAnchor="middle" className="text-[6px] font-black fill-slate-900 uppercase tracking-widest">{name}</text>
        </g>
    )
}
