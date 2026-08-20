"use client"

import React, { useState, useRef, useEffect } from "react"
import { TrophyIcon as Trophy, ChevronDownIcon as ChevronDown, ChevronUpIcon as ChevronUp, ArrowUpOnSquareIcon as Share2, PencilSquareIcon as Edit2, ClockIcon as Clock, BoltIcon as Zap, ViewfinderCircleIcon as Target, QuestionMarkCircleIcon as HelpCircle } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"
import gsap from "gsap"

interface BetTicketProps {
    bet: any
    isHistory?: boolean
}

export function BetTicket({ bet, isHistory = false }: BetTicketProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const detailsRef = useRef<HTMLDivElement>(null)
    const arrowRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!detailsRef.current) return

        if (isExpanded) {
            gsap.fromTo(detailsRef.current,
                { height: 0, opacity: 0 },
                { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" }
            )
            gsap.to(arrowRef.current, { rotate: 180, duration: 0.3 })
        } else {
            gsap.to(detailsRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" })
            gsap.to(arrowRef.current, { rotate: 0, duration: 0.3 })
        }
    }, [isExpanded])

    const statusColor = bet.status === 'won' ? 'emerald' : bet.status === 'lost' ? 'slate' : 'blue'
    const selections = bet.selections as any[]
    const isMultiple = selections.length > 1

    const formatDate = (date: string | Date) => {
        const d = new Date(date)
        return {
            day: d.toLocaleString('en-GB', { day: '2-digit' }),
            month: d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
        }
    }

    const { day, month } = formatDate(bet.createdAt)

    return (
        <div className="flex gap-3 md:gap-4 w-full group">
            {/* Date Gutter (Only for History) */}
            {isHistory && (
                <div className="flex flex-col items-center pt-2 w-8 md:w-12 shrink-0">
                    <span className="text-lg md:text-xl font-black text-foreground leading-none">{day}</span>
                    <span className="text-[10px] font-black text-muted-foreground tracking-widest">{month}</span>
                </div>
            )}

            {/* Ticket Card */}
            <div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-border">
                {/* Status Header Strip */}
                <div className={cn(
                    "px-6 py-2 flex items-center justify-between",
                    statusColor === 'emerald' ? "bg-emerald-500" :
                        statusColor === 'slate' ? "bg-slate-700" : "bg-slate-800"
                )}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                            {bet.mode === 'multi' ? 'Multiple' : bet.mode === 'single' ? 'Single' : (isMultiple ? "Multiple" : "Single")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {bet.status === 'won' && <Trophy className="h-3 w-3 text-white fill-white" />}
                        <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">
                            {bet.status}
                        </span>
                        <ChevronDown ref={arrowRef} className="h-4 w-4 text-white/70 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)} />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Summary View */}
                    {!isExpanded && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                {selections.slice(0, 3).map((sel, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                                        <span className="text-sm font-bold text-foreground/90 line-clamp-1">
                                            {sel.matchLabel}
                                        </span>
                                    </div>
                                ))}
                                {selections.length > 3 && (
                                    <div className="flex items-center justify-between pl-4">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                            and {selections.length - 3} other matches
                                        </span>
                                        <button
                                            onClick={() => setIsExpanded(true)}
                                            className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                                        >
                                            Match Details
                                        </button>
                                    </div>
                                )}
                                {selections.length <= 3 && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsExpanded(true)}
                                            className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                                        >
                                            Match Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Detailed Leg List (Expanded) */}
                    <div ref={detailsRef} className="overflow-hidden h-0 opacity-0">
                        <div className="space-y-6 pt-2 pb-4">
                            {selections.map((sel, idx) => (
                                <div key={idx} className="relative pl-8 border-l border-border/50 space-y-2">
                                    <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-muted border-2 border-background" />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                                {sel.marketName}
                                            </p>
                                            <p className="text-base font-black text-foreground leading-tight">
                                                {sel.matchLabel}
                                            </p>
                                        </div>
                                        {sel.currentMatch?.isLive && (
                                            <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-full text-[8px] font-black text-red-500 uppercase animate-pulse shrink-0">
                                                Live
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl border border-border/50">
                                            <span className="text-xs font-black text-primary">{sel.label}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">@</span>
                                            <span className="text-xs font-black text-foreground">{sel.odds.toFixed(2)}</span>
                                        </div>

                                        {/* Dynamic Badges based on market or logic */}
                                        {sel.marketName.toLowerCase().includes("score") && (
                                            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[8px] font-black text-blue-400 uppercase italic">
                                                Bore Draw
                                            </div>
                                        )}
                                        {bet.isBonusBet && (
                                            <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[8px] font-black text-amber-500 uppercase">
                                                Gift
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/70">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{sel.currentMatch?.startTime || "TBD"}</span>
                                        </div>
                                        {sel.currentMatch?.result?.scores && (
                                            <div className="flex items-center gap-1 text-primary">
                                                <Target className="h-3 w-3" />
                                                <span>Live: {Object.values(sel.currentMatch.result.scores).join(' - ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="w-full py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                            >
                                Hide Match Details ↑
                            </button>
                        </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="pt-4 border-t border-border/50 flex items-end justify-between">
                        <div className="flex gap-6">
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Stake</p>
                                <p className="text-lg font-black text-foreground leading-none">
                                    <span className="text-xs text-muted-foreground mr-1">GHS</span>
                                    {bet.stake.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                                    {bet.status === 'won' ? "Return" : "Potential Win"}
                                </p>
                                <p className={cn(
                                    "text-lg font-black leading-none",
                                    bet.status === 'won' ? "text-emerald-400" : "text-foreground"
                                )}>
                                    <span className="text-xs text-muted-foreground mr-1">GHS</span>
                                    {bet.potentialPayout.toLocaleString()}
                                </p>
                            </div>
                        </div>


                    </div>

                    {/* Ticket Metadata */}
                    <div className="pt-2 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">QuickStake • {bet.id.toUpperCase()}</span>
                    </div>
                </div>


            </div>
        </div>
    )
}
