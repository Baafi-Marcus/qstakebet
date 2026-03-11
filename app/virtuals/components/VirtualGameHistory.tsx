import React from "react"
import { X, Trophy, Ticket, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface VirtualGameHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    betHistory: any[];
    gameType: 'penalty' | 'marbles';
}

export function VirtualGameHistory({
    isOpen,
    onClose,
    betHistory,
    gameType,
}: VirtualGameHistoryProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-slate-900 w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-t-[2.5rem] md:rounded-[2.5rem] border-t border-x md:border border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Bet History</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {gameType === 'penalty' ? 'Q-Penalty Shootout' : 'Q-Marble Race'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0f1115]">
                    {betHistory.length > 0 ? (
                        betHistory.map((bet, i) => (
                            <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                                <div className={cn(
                                    "px-4 py-2 flex items-center justify-between",
                                    bet.status === 'WON' || (bet.payout > 0) ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-800/40 text-slate-400"
                                )}>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <Ticket className="h-3 w-3" />
                                        <span>{bet.status}</span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-60">
                                        {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Selections */}
                                    <div className="space-y-2">
                                        {bet.selections.map((sel: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-1 border-l-2 border-emerald-500/30 pl-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{sel.marketName}</span>
                                                    <span className="font-mono font-black text-xs text-emerald-400">@ {sel.odds.toFixed(2)}</span>
                                                </div>
                                                <div className="text-sm font-black text-white">{sel.label}</div>
                                                <div className="text-[10px] font-medium text-slate-500">{sel.matchLabel}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Outcome Summary */}
                                    {bet.outcome && (
                                        <div className="mt-4 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Trophy className="h-3 w-3 text-amber-500" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Result</span>
                                            </div>
                                            {gameType === 'penalty' ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn("text-sm font-black", bet.outcome.winner === 'A' ? "text-white" : "text-slate-500")}>
                                                            {bet.outcome.teamA.shortName}
                                                        </span>
                                                        <div className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono font-black">
                                                            {bet.outcome.scoreA} - {bet.outcome.scoreB}
                                                        </div>
                                                        <span className={cn("text-sm font-black", bet.outcome.winner === 'B' ? "text-white" : "text-slate-500")}>
                                                            {bet.outcome.teamB.shortName}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-white">Winner:</span>
                                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs font-black uppercase tracking-widest">
                                                        {bet.outcome.marbles?.find((m: any) => m.id === bet.outcome.winner)?.shortName || 'Unknown'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Financials */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Stake</p>
                                            <p className="text-sm font-black text-white">GHS {bet.stake?.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Payout</p>
                                            <p className={cn(
                                                "text-sm font-black",
                                                bet.payout > 0 ? "text-emerald-400" : "text-slate-500"
                                            )}>
                                                GHS {bet.payout?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                            <Ticket className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-black uppercase">No History</h3>
                            <p className="text-xs">Your virtual bets will appear here.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900 border-t border-white/5">
                    <button onClick={onClose} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                        Continue Playing
                    </button>
                </div>
            </div>
        </div>
    )
}
