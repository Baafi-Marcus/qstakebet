import React, { useState, useRef, useEffect } from "react"
import { ArrowLeft, Home, X, Trophy, ChevronRight, Ticket, ChevronDown, Clock, Target, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    ClientVirtualBet,
    ResolvedSelection,
    getTicketId,
} from "@/lib/virtuals"
import gsap from "gsap"

interface VirtualsHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    betHistory: ClientVirtualBet[];
}

export function VirtualsHistory({
    isOpen,
    onClose,
    betHistory,
}: VirtualsHistoryProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-900 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2.5rem] border border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Bet History</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instant Virtuals History</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-90">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0f1115]">
                    {betHistory.length > 0 ? (
                        betHistory.map((h, i) => (
                            <VirtualBetTicket key={i} bet={h} />
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="h-20 w-20 bg-slate-900 border border-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
                                <Ticket className="h-10 w-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">No tickets found</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest max-w-[200px] leading-relaxed">
                                You have no virtual betting history yet. Start playing to see your tickets here.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Footer */}
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95"
                    >
                        Return to Virtuals
                    </button>
                </div>
            </div>
        </div>
    )
}

function VirtualBetTicket({ bet }: { bet: ClientVirtualBet }) {
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

    const date = new Date(bet.timestamp || 0)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    const isWon = (bet.totalReturns ?? 0) > 0
    const statusColor = isWon ? 'emerald' : 'slate'
    const results = (bet.results || []) as ResolvedSelection[]

    return (
        <div className="flex gap-4 w-full group">
            {/* Date Gutter */}
            <div className="flex flex-col items-center pt-2 w-10 shrink-0">
                <span className="text-xl font-black text-white leading-none group-hover:text-primary transition-colors">{day}</span>
                <span className="text-[10px] font-black text-slate-500 tracking-widest mt-1">{month}</span>
            </div>

            {/* Ticket Card */}
            <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:border-white/10">
                {/* Status Header Strip */}
                <div className={cn(
                    "px-5 py-2 flex items-center justify-between",
                    isWon ? "bg-emerald-500" : "bg-slate-700"
                )}>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-white tracking-[0.2em]">
                            {bet.mode === 'multi' ? 'Multiple' : 'Single'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isWon && <Trophy className="h-3 w-3 text-white fill-white" />}
                        <span className="text-[9px] font-black uppercase text-white tracking-[0.1em]">
                            {isWon ? "Won" : "Settled"}
                        </span>
                        <ChevronDown ref={arrowRef} className="h-4 w-4 text-white/70 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)} />
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Summary View */}
                    {!isExpanded && (
                        <div className="space-y-3">
                            {results.slice(0, 3).map((r, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        r.won ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-500"
                                    )} />
                                    <span className="text-[11px] font-bold text-slate-200 truncate">
                                        {[r.schoolA, r.schoolB, r.schoolC].filter(Boolean).join(' vs ')}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between pt-1">
                                {results.length > 3 && (
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">
                                        + {results.length - 3} other events
                                    </span>
                                ) || <span />}
                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="text-[9px] font-black text-primary uppercase tracking-wider hover:underline"
                                >
                                    Match Details
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Detailed Leg List (Expanded) */}
                    <div ref={detailsRef} className="overflow-hidden h-0 opacity-0">
                        <div className="space-y-6 pt-2 pb-2">
                            {results.map((r, idx) => (
                                <div key={idx} className="relative pl-7 border-l-2 border-white/5 space-y-2">
                                    <div className={cn(
                                        "absolute -left-[7px] top-0 h-3 w-3 rounded-full border-2 border-slate-900",
                                        r.won ? "bg-emerald-500" : "bg-red-500"
                                    )} />

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{r.marketName}</p>
                                        <p className="text-sm font-black text-white leading-tight">
                                            {[r.schoolA, r.schoolB, r.schoolC].filter(Boolean).join(' vs ')}
                                        </p>
                                    </div>

                                    {/* Virtual Score Grid */}
                                    <div className="flex flex-col gap-1.5 py-1">
                                        <span className="text-[9px] font-bold text-slate-600 uppercase">Result:</span>
                                        {r.outcome ? (
                                            <div className="flex gap-2">
                                                {r.outcome.schools.map((s, si) => (
                                                    <div key={si} className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 flex flex-col items-center min-w-[50px]">
                                                        <span className="text-sm font-black text-white tabular-nums">{r.outcome?.totalScores[si]}</span>
                                                        <span className="text-[7px] font-bold text-slate-500 uppercase truncate w-[40px] text-center">{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase italic">Refunded</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                                            <span className="text-[10px] font-black text-primary">{r.label}</span>
                                            <span className="text-[9px] font-bold text-slate-600">@</span>
                                            <span className="text-[10px] font-black text-white">{r.odds.toFixed(2)}</span>
                                        </div>
                                        <div className="px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[8px] font-black text-primary uppercase">
                                            Instant
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                        <div className="flex gap-6">
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Stake</p>
                                <p className="text-base font-black text-white leading-none">
                                    <span className="text-[10px] text-slate-500 mr-0.5">GHS</span>
                                    {bet.totalStake.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Return</p>
                                <p className={cn(
                                    "text-base font-black leading-none",
                                    isWon ? "text-emerald-400" : "text-slate-400"
                                )}>
                                    <span className="text-[10px] text-slate-500 mr-0.5">GHS</span>
                                    {(bet.totalReturns ?? 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="p-2 bg-white/5 rounded-xl border border-white/5 text-slate-500 hover:text-white transition-colors">
                                <Share2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-bold text-slate-600 uppercase">TICKET ID: {getTicketId(bet.id)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
