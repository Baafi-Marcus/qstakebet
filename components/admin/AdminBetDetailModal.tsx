"use client"

import React from "react"
import { X, Clock, Trophy, Target, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Selection {
    id: string
    matchId: string
    marketName: string
    label: string
    odds: number
    status?: string
    currentMatch?: any
}

interface AdminBetDetailModalProps {
    bet: any
    isOpen: boolean
    onClose: () => void
}

export function AdminBetDetailModal({ bet, isOpen, onClose }: AdminBetDetailModalProps) {
    if (!isOpen || !bet) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl elevation-24">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ticket Audit</span>
                            <div className="h-1 w-1 rounded-full bg-slate-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{bet.id}</span>
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Bet Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group"
                    >
                        <X className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* User Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Customer</div>
                            <div className="text-sm font-black text-white">{bet.userName || "Unknown"}</div>
                            <div className="text-[10px] font-bold text-slate-400 truncate">{bet.userEmail}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Placed At</div>
                            <div className="text-sm font-black text-white">
                                {format(new Date(bet.createdAt), "MMM d, yyyy")}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400">
                                {format(new Date(bet.createdAt), "HH:mm:ss")}
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy className="h-24 w-24 text-primary" />
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                            <div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Stake</div>
                                <div className="text-xl font-black text-white tracking-tighter">₵{bet.stake.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Odds</div>
                                <div className="text-xl font-black text-primary tracking-tighter">x{bet.totalOdds.toFixed(2)}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Potential Payout</div>
                                <div className="text-xl font-black text-emerald-400 tracking-tighter">₵{bet.potentialPayout.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Selections List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Market Breakdowns</h3>
                        {bet.selections.map((sel: Selection, idx: number) => (
                            <div key={idx} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-950/60 transition-colors">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{sel.marketName}</span>
                                            {sel.status && (
                                                <div className={cn(
                                                    "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest",
                                                    sel.status === 'won' ? "bg-emerald-500/20 text-emerald-400" :
                                                        sel.status === 'lost' ? "bg-red-500/20 text-red-400" : "bg-white/10 text-slate-400"
                                                )}>
                                                    {sel.status}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm font-black text-white uppercase tracking-tight">
                                            {sel.label} <span className="text-primary ml-1">@{sel.odds}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-600 uppercase mb-1">Match Date</div>
                                        <div className="text-[10px] font-black text-white/60">{sel.currentMatch?.startTime || "TBD"}</div>
                                    </div>
                                </div>

                                {/* Settlement Audit Detail */}
                                {(sel.currentMatch?.status === 'finished' || sel.currentMatch?.status === 'settled') && (
                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                                        <div className="p-3 bg-white/[0.02] rounded-xl">
                                            <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest block mb-1">Raw Match Scores</span>
                                            <div className="text-[11px] font-black text-white">
                                                {sel.currentMatch.result?.scores ?
                                                    Object.entries(sel.currentMatch.result.scores).map(([sid, score]: any) => {
                                                        const team = sel.currentMatch.participants.find((p: any) => p.schoolId === sid);
                                                        return `${team?.name || sid}: ${score}`;
                                                    }).join(' vs ') :
                                                    (sel.currentMatch.result?.winner || "No Score Data")}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "p-3 rounded-xl border",
                                            sel.status === 'won' ? "bg-emerald-500/5 border-emerald-500/10" :
                                                sel.status === 'lost' ? "bg-red-500/5 border-red-500/10" : "bg-white/[0.02] border-white/5"
                                        )}>
                                            <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest block mb-1">Determined Outcome</span>
                                            <div className={cn(
                                                "text-[11px] font-black",
                                                sel.status === 'won' ? "text-emerald-400" :
                                                    sel.status === 'lost' ? "text-red-400" : "text-white"
                                            )}>
                                                {getMarketOutcomeLabel(sel)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-950/80 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            bet.status === 'won' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                                bet.status === 'lost' ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-amber-500"
                        )} />
                        <span className="text-xs font-black text-white uppercase tracking-widest">
                            Bet Status: {bet.status}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        </div>
    )
}

function getMarketOutcomeLabel(sel: any) {
    const market = sel.marketName?.toLowerCase() || "";
    const result = sel.currentMatch?.result;
    if (!result) return "No Result Data";

    if (market.includes("winner") || market.includes("1x2") || market.includes("win")) {
        if (result.winner === 'X') return 'Outcome: DRAW';
        const winner = sel.currentMatch?.participants?.find((p: any) => p.schoolId === result.winner);
        return `Winner: ${winner?.name || result.winner}`;
    }
    if (market.includes("total") || market.includes("over") || market.includes("under")) {
        const scores = result.scores || {};
        const total = Object.values(scores).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        const threshold = parseFloat(sel.label.match(/[\d.]+/)?.[0] || "1.5");
        return `Total: ${total} (${total > threshold ? 'Over' : 'Under'} ${threshold})`;
    }
    if (market.includes("btts")) {
        const scores = result.scores || {};
        const values = Object.values(scores);
        const both = values.length >= 2 && values.every(s => (Number(s) || 0) > 0);
        return `Both Score: ${both ? "YES" : "NO"}`;
    }
    return `Settled as: ${sel.status?.toUpperCase()}`;
}
