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
    const isSettlement = gameState.phase === 'SET_SETTLEMENT' || gameState.phase === 'SETTLEMENT'

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

    const isKicking = attemptTime > 1.0 && attemptTime < 1.3
    const isFlying = attemptTime >= 1.2 && attemptTime < 1.6
    const isFinished = attemptTime >= 1.6

    const getBallPos = (dir: string) => {
        if (!isFlying && !isFinished) return 'translate-y-32 scale-150'
        switch (dir) {
            case 'left': return '-translate-x-32 -translate-y-28 scale-50'
            case 'right': return 'translate-x-32 -translate-y-28 scale-50'
            default: return '-translate-y-32 scale-50' // center
        }
    }

    if (!isInProgress && !isSettlement) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-900/20 rounded-3xl overflow-hidden">
                 <div className="w-64 h-32 border-4 border-white/5 rounded-t-lg relative">
                    <div className="absolute inset-0 bg-slate-900/50" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                     Preparation Phase
                 </span>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-end overflow-hidden rounded-3xl">
            {/* Stadium Background Overhaul */}
            <div className="absolute inset-0 z-0">
                 {/* Turf with perspective */}
                 <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-emerald-900 to-emerald-600 skew-y-1 transform-gpu origin-bottom shadow-inner" />
                 <div className="absolute bottom-0 w-full h-[60%] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]" />
                 
                 {/* Crowd/Stand background */}
                 <div className="absolute top-0 w-full h-[45%] bg-slate-900 flex flex-col justify-end overflow-hidden p-2">
                      <div className="flex flex-wrap gap-1 justify-center opacity-30 grayscale blur-[1px]">
                           {[...Array(40)].map((_, i) => (
                               <div key={i} className="w-4 h-6 bg-slate-700 rounded-t-lg" />
                           ))}
                      </div>
                      <div className="h-4 w-full bg-slate-800 border-t border-white/5" />
                 </div>

                 {/* Floodlights effect */}
                 <div className="absolute top-0 left-10 w-32 h-64 bg-white/5 blur-[80px] -rotate-45" />
                 <div className="absolute top-0 right-10 w-32 h-64 bg-white/5 blur-[80px] rotate-45" />
            </div>

            {/* Scoreboard / Sequence Overlay (Top Left matching reference) */}
            <div className="absolute top-4 left-6 z-40 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 min-w-[120px] shadow-2xl">
                 <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Shootout</span>
                      <span className="text-[8px] font-black text-emerald-400">LIVE</span>
                 </div>
                 <div className="flex flex-col gap-1.5">
                      {/* Team A dots */}
                      <div className="flex items-center justify-between gap-4">
                           <span className="text-[10px] font-black text-white truncate max-w-[50px]">{outcome.teamA.shortName}</span>
                           <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => {
                                    const res = outcome.attemptsA[i]
                                    const isPast = (currentAttemptIdx / 2) > i || (!isPlayerBTurn && currentRound === i && isFinished)
                                    return (
                                        <div key={i} className={cn(
                                            "w-2.5 h-2.5 rounded-sm border transition-all duration-300",
                                            !isPast ? "bg-black/40 border-white/10" : 
                                            res?.isScored ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500 border-red-400"
                                        )} />
                                    )
                                })}
                           </div>
                      </div>
                      {/* Team B dots */}
                      <div className="flex items-center justify-between gap-4">
                           <span className="text-[10px] font-black text-white truncate max-w-[50px]">{outcome.teamB.shortName}</span>
                           <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => {
                                    const res = outcome.attemptsB[i]
                                    const isPast = (currentAttemptIdx / 2) > i + 0.5 || (isPlayerBTurn && currentRound === i && isFinished)
                                    return (
                                        <div key={i} className={cn(
                                            "w-2.5 h-2.5 rounded-sm border transition-all duration-300",
                                            !isPast ? "bg-black/40 border-white/10" : 
                                            res?.isScored ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500 border-red-400"
                                        )} />
                                    )
                                })}
                           </div>
                      </div>
                 </div>
            </div>

            {/* The Goal Area */}
            <div className="w-[450px] h-[220px] relative z-10 flex flex-col items-center justify-end pb-4 group">
                {/* 3D-ish Goal Frame */}
                <div className="w-full h-[180px] border-t-[12px] border-x-[12px] border-white/95 bg-white/5 rounded-t-sm relative shadow-[0_-20px_100px_rgba(0,0,0,0.5)] transform translate-z-10">
                     {/* Net texture (More realistic) */}
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] opacity-10" />
                     <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                     
                     {/* Goal Shadow on Grass */}
                     <div className="absolute -bottom-2 -left-4 -right-4 h-8 bg-black/40 blur-md rounded-full -z-10" />
                </div>
                
                {/* Goalkeeper (Enhanced with legs) */}
                <div 
                    className={cn(
                        "absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-32 transition-all duration-[600ms] flex flex-col items-center justify-end z-20",
                        isKicking && currentAttempt && (
                            currentAttempt.goalieDirection === 'left' ? "-translate-x-52 -rotate-[35deg] -translate-y-6" : 
                            currentAttempt.goalieDirection === 'right' ? "translate-x-52 rotate-[35deg] -translate-y-6" : 
                            currentAttempt.goalieDirection === 'center' ? "-translate-y-20 scale-110" : ""
                        )
                    )}
                >
                    <svg viewBox="0 0 100 140" className="w-full h-full filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] transform-gpu">
                        <defs>
                             <linearGradient id="gkKit" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#facc15" />
                                  <stop offset="100%" stopColor="#ca8a04" />
                             </linearGradient>
                        </defs>
                        {/* Head */}
                        <circle cx="50" cy="20" r="12" fill="#fde68a" />
                        {/* Torso */}
                        <path d="M25 35 Q50 30 75 35 L80 80 Q50 85 20 80 Z" fill="url(#gkKit)" />
                        
                        {/* Legs (Fix: Added) */}
                        <path d="M30 80 L25 125 Q25 135 35 135 L42 135" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" fill="none" />
                        <path d="M70 80 L75 125 Q75 135 65 135 L58 135" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" fill="none" />
                        
                        {/* Boots */}
                        <rect x="25" y="125" width="18" height="10" rx="4" fill="black" />
                        <rect x="57" y="125" width="18" height="10" rx="4" fill="black" />

                        {/* Animated Arms */}
                        <path 
                            d={cn(
                                "M30 40 L5 65", 
                                isKicking && currentAttempt?.goalieDirection === 'left' ? "M30 40 L0 10" : "",
                                isKicking && currentAttempt?.goalieDirection === 'right' ? "M30 40 L20 75" : ""
                            )} 
                            stroke="#ca8a04" strokeWidth="12" strokeLinecap="round" 
                            className="transition-all duration-300"
                        />
                        <path 
                            d={cn(
                                "M70 40 L95 65",
                                isKicking && currentAttempt?.goalieDirection === 'right' ? "M70 40 L100 10" : "",
                                isKicking && currentAttempt?.goalieDirection === 'left' ? "M70 40 L80 75" : ""
                            )} 
                            stroke="#ca8a04" strokeWidth="12" strokeLinecap="round"
                            className="transition-all duration-300"
                        />
                         {/* Gloves */}
                         <rect x={isKicking && currentAttempt?.goalieDirection === 'left' ? "-5" : "0"} y={isKicking && currentAttempt?.goalieDirection === 'left' ? "5" : "60"} width="14" height="14" rx="4" fill="white" />
                         <rect x={isKicking && currentAttempt?.goalieDirection === 'right' ? "93" : "88"} y={isKicking && currentAttempt?.goalieDirection === 'right' ? "5" : "60"} width="14" height="14" rx="4" fill="white" />
                    </svg>
                </div>

                {/* Kicker Shadow (Spotlight style) */}
                <div className="absolute bottom-[-60px] w-28 h-10 bg-black/50 blur-2xl rounded-full z-0 transform scale-x-150" />

                {/* The Ball (Enhanced with motion blur) */}
                <div 
                    className={cn(
                        "absolute left-1/2 -ml-5 bottom-[-45px] w-10 h-10 transition-all duration-[450ms] ease-out z-30",
                        currentAttempt ? getBallPos(currentAttempt.direction) : "translate-y-36 scale-150"
                    )}
                >
                    <div className={cn(
                        "w-full h-full bg-white rounded-full shadow-2xl relative overflow-hidden",
                        isFlying && "blur-[0.5px] scale-x-110"
                    )}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/football-no-lines.png')] opacity-60" />
                        <div className="absolute top-1 left-2 w-3 h-3 bg-white/80 rounded-full blur-[1px]" />
                        <div className="w-full h-full border border-black/10 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Kick Indicator (Lowered to avoid blocking) */}
            <div className="absolute bottom-4 right-6 z-40 bg-white p-2 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in-right opacity-80 scale-90">
                 <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-900 border border-slate-200 text-[10px]">
                      {currentRound + 1}
                 </div>
                 <div className="flex flex-col">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Shot</span>
                      <span className="text-[10px] font-black text-slate-900 uppercase italic">
                           {isPlayerBTurn ? outcome.teamB.shortName : outcome.teamA.shortName}
                      </span>
                 </div>
            </div>

            {/* Result Popup - Larger and higher */}
            {isFinished && (
                <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none pb-20">
                    <div className={cn(
                        "px-12 py-6 rounded-[2rem] backdrop-blur-2xl border-4 transform skew-x-[-15deg] shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-75 duration-300",
                        currentAttempt?.isScored 
                            ? "bg-emerald-500/95 border-emerald-300 text-white" 
                            : "bg-red-500/95 border-red-300 text-white"
                    )}>
                        <div className="text-8xl font-black uppercase italic tracking-tighter drop-shadow-2xl">
                            {currentAttempt?.isScored ? "GOAL!" : "MISSED"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
