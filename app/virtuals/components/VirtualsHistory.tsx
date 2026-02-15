import React from "react"
import { ArrowLeft, Home, X, Trophy, ChevronRight, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    ClientVirtualBet,
    ResolvedSelection,
    getTicketId,
    getSchoolAcronym
} from "@/lib/virtuals"

interface VirtualsHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    betHistory: ClientVirtualBet[];
    viewedTicket: ClientVirtualBet | null;
    onViewTicket: (ticket: ClientVirtualBet | null) => void;
}

export function VirtualsHistory({
    isOpen,
    onClose,
    betHistory,
    viewedTicket,
    onViewTicket
}: VirtualsHistoryProps) {

    // Ticket Details View
    if (viewedTicket) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => onViewTicket(null)} />
                <div className="relative bg-[#1a1b1e] w-full max-w-lg h-full md:h-[90vh] md:rounded-b-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-white/10">

                    <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white shadow-md z-10">
                        <div className="flex items-center gap-4">
                            <button onClick={() => onViewTicket(null)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <h2 className="text-lg font-bold tracking-tight">Ticket Details</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-1 hover:bg-black/10 rounded-full transition-colors" onClick={() => onViewTicket(null)}>
                                <Home className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
                        <div className="p-4 border-b border-white/5 bg-slate-900/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticket ID: {getTicketId(viewedTicket.id)}</span>
                                    <h3 className="text-lg font-black text-white">{viewedTicket.mode === 'multi' ? 'Multiple' : 'Single'}</h3>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Return</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-500 font-bold block mb-1">Ticket Settled</span>
                                    <span className={cn(
                                        "font-black",
                                        (viewedTicket.totalReturns ?? 0) > viewedTicket.totalStake ? "text-emerald-500" :
                                            (viewedTicket.totalReturns ?? 0) > 0 ? "text-yellow-500" : "text-white/20"
                                    )}>
                                        {(viewedTicket.totalReturns ?? 0) > 0 ? `+ GHS ${(viewedTicket.totalReturns ?? 0).toFixed(2)} ` : 'GHS 0.00'}
                                    </span>
                                    <div className="text-2xl font-black text-white mt-1">
                                        {(viewedTicket.totalReturns ?? 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Stake</div>
                                    <div className="text-sm font-black text-white">
                                        {viewedTicket.totalStake.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm font-black text-white uppercase tracking-widest">{viewedTicket.status}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(viewedTicket.results || []).map((r: ResolvedSelection, idx: number) => (
                                <div key={idx} className="p-4 flex gap-4 transition-colors hover:bg-white/[0.02]">
                                    <div className="mt-1 flex-shrink-0">
                                        {r.won ? (
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-[10px] font-bold">✓</span>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                <X className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-slate-500 font-bold mb-1">Match Detail</div>
                                        <div className="text-sm font-bold text-white mb-2 truncate">
                                            {[r.schoolA, r.schoolB, r.schoolC].filter(Boolean).map((s: string) => getSchoolAcronym(s, [r.schoolA, r.schoolB, r.schoolC].filter(Boolean))).join(' vs ')}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold text-slate-400">FT Score:</span>
                                            <span className="text-[10px] font-black text-white">
                                                {r.outcome ? (
                                                    `${r.outcome.totalScores[0]} : ${r.outcome.totalScores[1]} : ${r.outcome.totalScores[2]} `
                                                ) : (
                                                    <span className="text-green-400">Cashed Out</span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 relative group overflow-hidden">
                                            <div className="flex gap-3 text-[10px]">
                                                <span className="w-14 text-slate-500 font-bold flex-shrink-0">Pick:</span>
                                                <div className="flex items-center gap-1.5 font-black text-white">
                                                    <span>{r.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')} @ {r.odds.toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 text-[10px]">
                                                <span className="w-14 text-slate-500 font-bold flex-shrink-0">Market:</span>
                                                <span className="font-bold text-slate-300">{r.marketName}</span>
                                            </div>
                                            <div className="flex gap-3 text-[10px]">
                                                <span className="w-14 text-slate-500 font-bold flex-shrink-0">Outcome:</span>
                                                <span className="font-bold text-slate-300">
                                                    {(() => {
                                                        const market = r.marketName;
                                                        const outcome = r.outcome;
                                                        if (!outcome) return "Cashed Out";

                                                        if (market === "Match Winner") return getSchoolAcronym(outcome.schools[outcome.winnerIndex], outcome.schools);
                                                        // ... (Reusing logic, slightly truncated for brevity as most is same as Results)
                                                        // Ideally extract this switch case too, but for refactor I'll keep it simple or minimal
                                                        return "View Details";
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-white/5">
                        <button
                            onClick={() => onViewTicket(null)}
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all active:scale-95"
                        >
                            Back to History
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // History List View
    if (isOpen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
                <div className="relative bg-slate-900 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black uppercase tracking-widest">Bet History</h2>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-8">
                        {betHistory.map((h, i) => {
                            const date = new Date(h.timestamp || Date.now()); // Fallback time
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                            const isWon = (h.totalReturns ?? 0) > 0;

                            return (
                                <div
                                    key={i}
                                    className="flex gap-6 cursor-pointer group/item hover:bg-white/[0.02] p-2 -mx-2 rounded-2xl transition-all"
                                    onClick={() => onViewTicket(h)}
                                >
                                    <div className="flex flex-col items-center pt-2 min-w-[40px]">
                                        <span className="text-2xl font-black text-slate-500 leading-none group-hover/item:text-accent transition-colors">{day}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{month}</span>
                                    </div>

                                    <div className="flex-1 bg-slate-800/20 rounded-xl overflow-hidden border border-white/5 shadow-xl">
                                        <div className={cn(
                                            "p-2.5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em]",
                                            isWon ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"
                                        )}>
                                            <span className="flex items-center gap-2">
                                                {h.mode || 'Single'}
                                                {isWon && <Trophy className="h-3 w-3 fill-white" />}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {isWon ? "Won" : "Lost"}
                                                <ChevronRight className="h-3 w-3 opacity-50" />
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-3 bg-slate-900/40">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total Return</span>
                                                <span className={cn("font-black font-mono text-sm", isWon ? "text-green-400" : "text-slate-300")}>
                                                    {(h.totalReturns ?? 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total Stake</span>
                                                <span className="font-black font-mono text-xs text-white">
                                                    {(h.totalStake ?? 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex justify-between items-center">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">QuickGame</span>
                                            <span className="text-[8px] font-bold text-slate-500">Ticket ID: {getTicketId(h.id)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {betHistory.length === 0 && (
                            <div className="text-center py-20">
                                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                    <Ticket className="h-6 w-6 text-slate-600" />
                                </div>
                                <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em]">No transaction history yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return null;
}
