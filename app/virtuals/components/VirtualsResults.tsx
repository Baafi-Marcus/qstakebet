import React from "react"
import { ArrowLeft, Info, Home, X, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    ResolvedSlip,
    ResolvedSelection,
    getTicketId,
    calculateTotalOdds,
    getSchoolAcronym
} from "@/lib/virtuals"

interface VirtualsResultsProps {
    isOpen: boolean;
    onClose: () => void;
    onNextRound: () => void;
    lastOutcome: { resolvedSlips: ResolvedSlip[], results: ResolvedSelection[], roundId: number } | null;
    autoNextRoundCountdown: number | null;
    betMode: string;
}

export function VirtualsResults({
    isOpen,
    onClose,
    onNextRound,
    lastOutcome,
    autoNextRoundCountdown,
    betMode
}: VirtualsResultsProps) {
    const [currentTime, setCurrentTime] = React.useState<string>("");

    React.useEffect(() => {
        if (isOpen) {
            setCurrentTime(new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }));
        }
    }, [isOpen]);

    if (!isOpen || !lastOutcome) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <div className="relative bg-[#1a1b1e] w-full max-w-lg h-full md:h-[90vh] md:rounded-b-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300">

                {/* Sticky Red Header */}
                <div className="bg-red-600 px-4 py-3 flex items-center justify-between text-white shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { onClose(); onNextRound(); }} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                        <h2 className="text-lg font-bold tracking-tight">Ticket Details</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-1 hover:bg-black/10 rounded-full transition-colors">
                            <Info className="h-5 w-5" />
                        </button>
                        <button onClick={() => { onClose(); onNextRound(); }} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                            <Home className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-slate-900 custom-scrollbar">
                    {/* Ticket Summary */}
                    <div className="p-4 border-b border-white/5 bg-slate-900/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticket ID: {getTicketId(lastOutcome?.roundId)}</span>
                                <h3 className="text-lg font-black text-white">{betMode === 'multi' ? 'Multiple' : 'Single'}</h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Return</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-bold block mb-1">{currentTime}</span>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-block",
                                    (lastOutcome?.resolvedSlips || []).every((s: ResolvedSlip) => s.status === 'WON') ? "bg-green-500/20 text-green-400" :
                                        (lastOutcome?.resolvedSlips || []).some((s: ResolvedSlip) => s.status === 'WON') ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-500"
                                )}>
                                    {(lastOutcome?.resolvedSlips || []).every((s: ResolvedSlip) => s.status === 'WON') ? 'Won' :
                                        (lastOutcome?.resolvedSlips || []).some((s: ResolvedSlip) => s.status === 'WON') ? 'Partial' : 'Lost'}
                                </div>
                                <div className="text-2xl font-black text-white mt-1">
                                    {(() => {
                                        const totalReturn = (lastOutcome?.resolvedSlips || []).reduce((acc: number, s: ResolvedSlip) => acc + (s.totalReturns ?? 0), 0);
                                        return totalReturn.toFixed(2);
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Stake</div>
                                <div className="text-sm font-black text-white">
                                    {(lastOutcome?.results || []).reduce((acc: number, r) => acc + (r.stakeUsed ?? 0), 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Odds</div>
                                <div className="text-sm font-black text-white">
                                    {calculateTotalOdds(lastOutcome?.results || []).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selection Rows */}
                    <div className="divide-y divide-white/5">
                        {(lastOutcome?.results || []).map((r, idx: number) => (
                            <div key={idx} className="p-4 flex gap-4 transition-colors hover:bg-white/[0.02]">
                                {/* Status Icon */}
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

                                {/* Selection Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] text-slate-500 font-bold mb-1">
                                        Round {r.matchId.split('-')[1]} • {r.outcome.category}
                                    </div>
                                    <div className="text-sm font-bold text-white mb-2 truncate">
                                        {[r.schoolA, r.schoolB, r.schoolC].filter(Boolean).map((s: string) => getSchoolAcronym(s, [r.schoolA, r.schoolB, r.schoolC])).join(' vs ')}
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold text-slate-400">Total Score:</span>
                                        <span className="text-[10px] font-black text-white">
                                            {r.outcome.totalScores.join(' : ')}
                                        </span>
                                    </div>

                                    {/* Round Breakdown Table */}
                                    <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5 mb-3">
                                        <div className="grid grid-cols-4 gap-px bg-white/5 text-[7px] font-black uppercase text-slate-500 text-center py-1">
                                            <div>Round</div>
                                            {r.outcome.schools.map((s, i) => (
                                                <div key={i} className="truncate px-0.5">{getSchoolAcronym(s, r.outcome.schools)}</div>
                                            ))}
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {r.outcome.rounds.slice(0, 5).map((rd, ridx) => (
                                                <div key={ridx} className="grid grid-cols-4 gap-px text-center py-1 bg-white/[0.01]">
                                                    <div className="text-[7px] font-bold text-slate-600">R{ridx + 1}</div>
                                                    {rd.scores.map((s, si) => (
                                                        <div key={si} className="text-[9px] font-mono text-white/80">{s}</div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Details Box */}
                                    <div className="bg-slate-950/50 rounded-lg p-3 space-y-2 border border-white/5 relative group overflow-hidden">
                                        {r.won && (
                                            <div className="absolute right-2 bottom-2 text-green-500/10 opacity-40 group-hover:opacity-60 transition-opacity">
                                                <Trophy className="h-8 w-8" />
                                            </div>
                                        )}

                                        <div className="flex gap-3 text-[10px]">
                                            <span className="w-14 text-slate-500 font-bold flex-shrink-0">Pick:</span>
                                            <div className="flex items-center gap-1.5 font-black text-white">
                                                <span>{r.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')} @ {r.odds.toFixed(2)}</span>
                                                {r.won && <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-[8px]">✓</div>}
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
                                                    const schoolsArr = [r.schoolA, r.schoolB, r.schoolC].filter(Boolean);
                                                    const market = r.marketName;
                                                    const outcome = r.outcome;
                                                    if (market === "Match Winner") return getSchoolAcronym(outcome.schools[outcome.winnerIndex], schoolsArr);
                                                    if (market === "Total Points") return `Total ${outcome.totalScores.reduce((a: number, b: number) => a + b, 0)} pts`;
                                                    if (market === "Winning Margin") {
                                                        const sorted = [...outcome.totalScores].sort((a: number, b: number) => b - a);
                                                        const margin = sorted[0] - sorted[1];
                                                        if (margin >= 1 && margin <= 10) return "1-10";
                                                        if (margin >= 11 && margin <= 25) return "11-25";
                                                        return "26+";
                                                    }
                                                    if (market === "Highest Round" || market === "Highest Scoring Round") {
                                                        const rScore = (rIdx: number) => outcome.rounds[rIdx].scores.reduce((a: number, b: number) => a + b, 0);
                                                        const p1 = rScore(0);
                                                        const p2 = rScore(1) + rScore(2);
                                                        const p3 = rScore(3) + rScore(4);

                                                        const max = Math.max(p1, p2, p3);
                                                        if (p1 === max) return "Round 1";
                                                        if (p2 === max) return "Rounds 2 & 3";
                                                        if (p3 === max) return "Rounds 4 & 5";
                                                        return "Round 1";
                                                    }
                                                    if (market === "Perfect Round") return outcome.stats.perfectRound.some((p: boolean) => p) ? "Yes" : "No";
                                                    if (market === "Shutout Round") return outcome.stats.shutoutRound.some((s: boolean) => s) ? "Yes" : "No";
                                                    if (market === "Comeback Win") {
                                                        return (outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0) ? "Yes" : "No";
                                                    }
                                                    if (market === "Comeback Team") {
                                                        const isComeback = outcome.winnerIndex !== outcome.stats.strongStartIndex && outcome.stats.leadChanges > 0;
                                                        return isComeback ? outcome.schools[outcome.winnerIndex] : "None";
                                                    }
                                                    if (market === "First Bonus") return outcome.schools[outcome.stats.firstBonusIndex];
                                                    if (market === "Late Surge") return outcome.schools[outcome.stats.lateSurgeIndex];
                                                    if (market === "Lead Changes") return `${outcome.stats.leadChanges} Changes`;
                                                    if (market.includes("Winner")) {
                                                        const roundNum = parseInt(market.split(" ")[1]);
                                                        const roundIndex = roundNum - 1;
                                                        const scores = outcome.rounds[roundIndex].scores;
                                                        const max = Math.max(...scores);
                                                        const winnerIdx = scores.indexOf(max);
                                                        return outcome.schools[winnerIdx];
                                                    }
                                                    return "Settled";
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fixed Footer Action */}
                <div className="p-4 bg-slate-900 border-t border-white/5">
                    <button
                        onClick={() => { onClose(); onNextRound(); }}
                        className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <span>Continue to Next Round</span>
                        {autoNextRoundCountdown !== null && (
                            <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-[10px] tabular-nums">
                                {autoNextRoundCountdown}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
