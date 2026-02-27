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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-900 w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-t-[2.5rem] md:rounded-[2.5rem] border-t border-x md:border border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 md:duration-200 md:zoom-in-95">
                {/* Visual Pull Bar for context */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 bg-white/10 rounded-full" />
                </div>
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
    const date = new Date(bet.timestamp || 0)
    const formattedDate = date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).toUpperCase()

    const isWon = (bet.totalReturns ?? 0) > 0
    const results = (bet.results || []) as ResolvedSelection[]

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-purple-500/30 group">
            {/* Branded Header Strip */}
            <div className={cn(
                "px-5 py-2.5 flex items-center justify-between",
                isWon ? "bg-emerald-600" : "bg-purple-600"
            )}>
                <div className="flex items-center gap-2">
                    <Ticket className="h-3 w-3 text-white/80" />
                    <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">
                        {bet.mode === 'multi' ? 'Multiple' : 'Single'} Ticket
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">
                        {isWon ? "Winner" : "Settled"}
                    </span>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Meta Info */}
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{formattedDate}</span>
                    </div>
                    <span>ID: {getTicketId(bet.id)}</span>
                </div>

                {/* Selections List */}
                <div className="space-y-4">
                    {results.map((r, idx) => (
                        <div key={idx} className="relative pl-6 border-l border-white/10 py-1">
                            {/* Win/Loss Dot */}
                            <div className={cn(
                                "absolute -left-[4.5px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full",
                                r.won ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-500/50"
                            )} />

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                        Round {r.matchId?.split('-')[1] ?? '?'} • {r.marketName}
                                    </span>
                                    {r.won && <Trophy className="h-3 w-3 text-emerald-500" />}
                                </div>
                                <div className="text-xs font-black text-white/90">
                                    {[r.schoolA, r.schoolB, r.schoolC].filter(Boolean).join(' vs ')}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-black text-purple-400 border border-white/5">
                                        {r.label} @ {r.odds.toFixed(2)}
                                    </span>
                                    {r.outcome && (
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-[9px] font-bold text-slate-600">
                                                Final Score: {r.outcome.totalScores.join('-')}
                                            </span>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest",
                                                r.won ? "text-emerald-400" : "text-slate-500"
                                            )}>
                                                Outcome: {(() => {
                                                    const o = r.outcome;
                                                    const marketId = r.selectionId?.split('-')[0];
                                                    if (marketId === 'winner') return o.winnerIndex === 0 ? r.schoolA : o.winnerIndex === 1 ? r.schoolB : r.schoolC;
                                                    if (marketId === 'total_points') return o.totalScores.reduce((a, b) => a + b, 0).toString();
                                                    if (marketId === 'winning_margin') {
                                                        const scores = [...o.totalScores].sort((a, b) => b - a);
                                                        return (scores[0] - scores[1]).toString();
                                                    }
                                                    return r.won ? "Success" : "Lost";
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Totals */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Stake</p>
                        <p className="text-sm font-black text-white leading-none">
                            <span className="text-[9px] text-slate-500 mr-0.5">GHS</span>
                            {bet.totalStake.toLocaleString()}
                        </p>
                    </div>

                    <div className="text-right space-y-1">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Payout</p>
                        <p className={cn(
                            "text-lg font-black leading-none",
                            isWon ? "text-emerald-400" : "text-white/40"
                        )}>
                            <span className="text-[10px] text-slate-500 mr-1">GHS</span>
                            {(bet.totalReturns ?? 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
