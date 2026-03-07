import React from "react"
import { ArrowLeft, Clock, Target, Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BetTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    bet: any;
}

export function BetTicketModal({ isOpen, onClose, bet }: BetTicketModalProps) {
    if (!isOpen) return null;

    const selections = bet.selections as any[];
    const isMultiple = selections.length > 1;
    const statusColor = bet.status === 'won' ? 'emerald' : bet.status === 'lost' ? 'red' : 'blue';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-[#1a1b1e] w-full max-w-lg h-full md:h-[90vh] md:rounded-b-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className={cn("px-4 py-3 flex items-center justify-between text-white shadow-md z-10",
                    statusColor === 'emerald' ? "bg-emerald-600" :
                        statusColor === 'red' ? "bg-red-600" : "bg-blue-600"
                )}>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <h2 className="text-lg font-bold tracking-tight">Ticket Details</h2>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                            {bet.id.substring(0, 13)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
                    {/* Summary Card */}
                    <div className="p-4 border-b border-white/5 bg-slate-900/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-block w-fit",
                                    statusColor === 'emerald' ? "bg-emerald-500/20 text-emerald-400" :
                                        statusColor === 'red' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                )}>
                                    {bet.status}
                                </div>
                                <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                                    {bet.mode === 'multi' ? 'Multiple' : bet.mode === 'single' ? 'Single' : (isMultiple ? "Multiple" : "Single")}
                                    {bet.isBonusBet && (
                                        <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[8px] font-black uppercase tracking-tighter">
                                            Gift
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                                    {bet.status === 'won' ? "Paid Return" : "Potential Win"}
                                </span>
                                <div className={cn("text-2xl font-black mt-1",
                                    bet.status === 'won' ? "text-emerald-400" :
                                        bet.status === 'lost' ? "text-red-400" : "text-white"
                                )}>
                                    {bet.status === 'lost' ? '0.00' : bet.potentialPayout.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Stake</div>
                                <div className="text-sm font-black text-white">
                                    {bet.stake.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Odds</div>
                                <div className="text-sm font-black text-white">
                                    {bet.totalOdds.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legs */}
                    <div className="divide-y divide-white/5">
                        {selections.map((sel, idx) => (
                            <div key={idx} className="p-4 flex gap-4 transition-colors hover:bg-white/[0.02]">
                                <div className="mt-1 flex-shrink-0">
                                    <div className="w-5 h-5 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
                                        <span className="text-slate-400 text-[10px] font-bold">{idx + 1}</span>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                                        {sel.marketName}
                                    </div>
                                    <div className="text-sm font-bold text-white leading-tight mb-2">
                                        {sel.matchLabel}
                                    </div>

                                    {/* Pick Details */}
                                    <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 relative group overflow-hidden">
                                        {bet.status === 'won' && (
                                            <div className="absolute right-2 bottom-2 text-green-500/10 opacity-40 group-hover:opacity-60 transition-opacity">
                                                <Trophy className="h-8 w-8" />
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-[10px]">
                                            <div className="flex gap-2 items-center">
                                                <span className="text-slate-500 font-bold uppercase tracking-widest">Pick:</span>
                                                <div className="flex items-center gap-1.5 font-black text-white">
                                                    <span className="text-primary">{sel.label}</span>
                                                </div>
                                            </div>
                                            <div className="font-black text-white">@ {sel.odds.toFixed(2)}</div>
                                        </div>
                                        {/* Dynamic Badges based on market or logic */}
                                        <div className="flex gap-2">
                                            {sel.marketName.toLowerCase().includes("score") && (
                                                <div className="px-2 py-0.5 mt-1 w-fit bg-blue-500/10 border border-blue-500/30 rounded-md text-[8px] font-black text-blue-400 uppercase italic">
                                                    Bore Draw
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Match Info */}
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 mt-3">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{sel.currentMatch?.startTime || "TBD"}</span>
                                        </div>
                                        {sel.currentMatch?.status === 'finished' && (
                                            <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-md border border-white/5 mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest">Match Outcome</span>
                                                    <div className="text-[10px] font-bold text-emerald-400">
                                                        {sel.currentMatch.result?.scores ?
                                                            Object.values(sel.currentMatch.result.scores).join(' - ') :
                                                            (sel.currentMatch.result?.winner || "Completed")}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {sel.currentMatch?.isLive && (
                                            <div className="flex items-center gap-2 p-2 bg-red-500/5 rounded-md border border-red-500/10 mt-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] text-red-500/70 uppercase font-black tracking-widest">Live Score</span>
                                                    <div className="text-[10px] font-black text-white">
                                                        {sel.currentMatch.result?.scores ? Object.values(sel.currentMatch.result.scores).join(' - ') : "0 - 0"}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-900 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        Close Ticket
                    </button>
                </div>
            </div>
        </div>
    )
}
