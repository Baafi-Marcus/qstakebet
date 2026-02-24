import React from "react"
import { Ticket, Zap, X, Wallet, ShieldAlert, Trophy, Banknote, ChevronLeft } from "lucide-react"
import { Match } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MULTI_BONUS } from "@/lib/constants"
import {
    getSchoolAcronym,
    calculateTotalOdds,
    ClientVirtualBet,
    VirtualSelection,
    ResolvedSlip,
    ResolvedSelection
} from "@/lib/virtuals"

// Re-defining constants or importing if available
const STAKE_LIMITS = {
    MATCH_WINNER: 50,
    PROPS: 20,
    TOTAL_SLIP: 100
};


interface VirtualsBetSlipProps {
    isSimulationActive: boolean;
    pendingSlips: ClientVirtualBet[];
    selections: VirtualSelection[];
    isSimulating: boolean;
    onKickoff: () => void;
    showSlip: boolean;
    setShowSlip: (show: boolean) => void;
    slipTab: 'selections' | 'pending';
    setSlipTab: (tab: 'selections' | 'pending') => void;
    balanceType: 'cash' | 'gift';
    setBalanceType: (type: 'cash' | 'gift') => void;
    profile: { balance: number; bonusBalance?: number } | undefined;
    betMode: 'single' | 'multi';
    setBetMode: (mode: 'single' | 'multi') => void;
    toggleSelection: (selection: any) => void;
    setSelections: React.Dispatch<React.SetStateAction<VirtualSelection[]>>;
    matches: Match[];
    setSelectedMatchForDetails: (match: Match) => void;
    globalStake: number;
    setGlobalStake: (stake: number) => void;
    onPlaceBet: () => void;
    confirmCashoutSlipId: string | null;
    setConfirmCashoutSlipId: (id: string | null) => void;
    onConfirmCashout: () => void;
    hasConflicts: boolean;
}

export function VirtualsBetSlip({
    isSimulationActive,
    pendingSlips,
    selections,
    isSimulating,
    onKickoff,
    showSlip,
    setShowSlip,
    slipTab,
    setSlipTab,
    balanceType,
    setBalanceType,
    profile,
    betMode,
    setBetMode,
    toggleSelection,
    setSelections,
    matches,
    setSelectedMatchForDetails,
    globalStake,
    setGlobalStake,
    onPlaceBet,
    confirmCashoutSlipId,
    setConfirmCashoutSlipId,
    onConfirmCashout,
    hasConflicts
}: VirtualsBetSlipProps) {
    return (
        <>
            {/* Fixed Bottom Navigation - SportyBet Style Tab Bar */}
            {!isSimulationActive && (
                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
                        {/* Left Side: Active Slips Counter or History Trigger */}
                        <div className="flex -space-x-3">
                            {pendingSlips.slice(0, 3).map((slip, i) => (
                                <div key={slip.id} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center shadow-xl animate-in fade-in slide-in-from-left-4 duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <Ticket className="h-4 w-4 text-purple-400" />
                                </div>
                            ))}
                        </div>

                        {/* Center: Main Betting CTA */}
                        <div className="flex-1 flex items-center gap-2">
                            <button
                                onClick={onKickoff}
                                disabled={isSimulating || pendingSlips.length === 0}
                                className={cn(
                                    "flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5",
                                    isSimulating ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" :
                                        pendingSlips.length === 0 ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5" :
                                            "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20"
                                )}
                            >
                                <span className="text-xs">{isSimulating ? "SIMULATING..." : "KICKOFF"}</span>
                                {!isSimulating && pendingSlips.length > 0 && (
                                    <span className="text-[8px] opacity-70">{pendingSlips.length} SLIPS PENDING</span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowSlip(true)}
                                className={cn(
                                    "h-14 aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 overflow-hidden group",
                                    selections.length > 0
                                        ? "bg-purple-600/20 backdrop-blur-xl border border-purple-500/50 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                                        : "bg-slate-900/40 backdrop-blur-xl text-slate-500 border border-white/10"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Zap className={cn("h-5 w-5 relative z-10", selections.length > 0 ? "fill-purple-400 text-purple-400" : "")} />
                                {selections.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900 shadow-lg animate-in zoom-in duration-200">
                                        {selections.length}
                                    </span>
                                )}
                                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">SLIP</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Modal Bet Slip */}
            {
                showSlip && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                            onClick={() => setShowSlip(false)}
                        />

                        {/* Fullscreen Mobile Bottom Sheet */}
                        <div className="relative w-full h-[92%] mt-auto bg-slate-950 rounded-t-[2.5rem] border-t border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-500 cubic-bezier(0.4, 0, 0.2, 1)">
                            {/* Drag Handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-white/10 rounded-full" />
                            </div>
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-purple-400" />
                                    <h2 className="font-black text-sm uppercase tracking-[0.2em] text-white">Instant Slip</h2>
                                </div>
                                <button onClick={() => setShowSlip(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Selections / My Bets Tabs */}
                            <div className="p-2 grid grid-cols-2 gap-1 bg-slate-900 border-b border-white/5">
                                <button
                                    onClick={() => setSlipTab('selections')}
                                    className={cn(
                                        "py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
                                        slipTab === 'selections' ? "bg-slate-800 text-white shadow-xl" : "text-slate-500"
                                    )}
                                >
                                    Selections
                                    {selections.length > 0 && (
                                        <span className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                            {selections.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSlipTab('pending')}
                                    className={cn(
                                        "py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-2",
                                        slipTab === 'pending' ? "bg-slate-800 text-white shadow-xl" : "text-slate-500"
                                    )}
                                >
                                    My Bets
                                    {pendingSlips.length > 0 && (
                                        <span className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-[10px]">
                                            {pendingSlips.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {slipTab === 'selections' ? (
                                <>
                                    {/* Balance Selector in Slip */}
                                    <div className="flex gap-2 mb-4 px-4 pt-4">
                                        <button
                                            onClick={() => setBalanceType('cash')}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                balanceType === 'cash' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <Wallet className={cn("h-3 w-3", balanceType === 'cash' ? "text-green-500" : "text-slate-500")} />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cash</span>
                                            </div>
                                            <span className={cn("text-xs font-black font-mono", balanceType === 'cash' ? "text-white" : "text-slate-500")}>
                                                {(profile?.balance || 0).toFixed(2)}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setBalanceType('gift')}
                                            className={cn(
                                                "flex-1 py-2 px-3 rounded-xl border flex flex-col items-center justify-center transition-all",
                                                balanceType === 'gift' ? "bg-purple-500/10 border-purple-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                            )}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <Zap className={cn("h-3 w-3", balanceType === 'gift' ? "text-purple-400" : "text-slate-500")} />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Gift</span>
                                            </div>
                                            <span className={cn("text-xs font-black font-mono", balanceType === 'gift' ? "text-purple-300" : "text-slate-500")}>
                                                {(profile?.bonusBalance || 0).toFixed(2)}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Singles/Multi/System Toggle */}
                                    <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5 mb-4 mx-4 max-w-[200px] shadow-inner">
                                        {(['single', 'multi'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setBetMode(mode)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all",
                                                    betMode === mode
                                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                                        : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selections List - Ultra Compact */}
                                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                                        {selections.map((sel) => (
                                            <div
                                                key={sel.selectionId}
                                                onClick={() => {
                                                    if (isSimulating) return;
                                                    const match = matches.find(m => m.id === sel.matchId);
                                                    if (match) {
                                                        setSelectedMatchForDetails(match);
                                                        setShowSlip(false);
                                                    }
                                                }}
                                                className="bg-slate-800/40 rounded border border-slate-700/40 relative group hover:border-purple-500/30 transition-all py-2 px-3 cursor-pointer active:scale-[0.98]"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelection(sel);
                                                    }}
                                                    className="absolute top-1 left-1 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>

                                                {/* Compact single row layout */}
                                                <div className="flex items-center justify-between gap-3 pl-5">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] sm:text-[9px] font-bold text-white leading-tight">
                                                            {sel.label.replace(/^O /, 'Over ').replace(/^U /, 'Under ')}
                                                        </div>
                                                        <div className="text-[9px] sm:text-[8px] text-slate-400 leading-snug mt-1 break-words line-clamp-2">
                                                            {[sel.schoolA, sel.schoolB, sel.schoolC].filter(Boolean).join(' vs ')}
                                                        </div>
                                                        <div className="text-[7px] text-slate-500 uppercase tracking-wide mt-1">
                                                            {sel.marketName}
                                                        </div>

                                                        {/* Individual Leg Stake (Singles Mode Overlay) */}
                                                        {betMode === 'single' && (
                                                            <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                                                <span className="text-[7px] font-black text-slate-500 uppercase italic">MAX {sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS}</span>
                                                                <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-white/10">
                                                                    <span className="text-[7px] text-slate-500 font-bold">GHS</span>
                                                                    <input
                                                                        type="number"
                                                                        value={sel.stakeUsed || ""}
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value);
                                                                            const limit = sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS;
                                                                            const cappedVal = isNaN(val) ? 0 : Math.min(val, limit);

                                                                            setSelections(prev => prev.map(s =>
                                                                                s.selectionId === sel.selectionId ? { ...s, stakeUsed: cappedVal } : s
                                                                            ));
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-10 bg-transparent text-right focus:outline-none text-white font-mono text-[9px]"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className="text-sm font-black text-accent font-mono">{sel.odds.toFixed(2)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-3 border-t border-white/10 bg-slate-900 space-y-2">
                                        {/* Alerts at bottom for visibility */}
                                        {hasConflicts && (
                                            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                                <ShieldAlert className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                                <p className="text-[7px] font-bold text-red-400 leading-tight">Multiple markets from same match = Singles only</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                            <div className="flex flex-col">
                                                <span>Total Stake</span>
                                                <span className="text-[7px] text-slate-500 lowercase leading-none mt-0.5">limit {STAKE_LIMITS.TOTAL_SLIP}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/40 rounded p-1.5 border border-white/10">
                                                <span className="text-[8px] text-slate-500 font-bold">GHS</span>
                                                <input
                                                    type="number"
                                                    value={globalStake || ""}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (val > STAKE_LIMITS.TOTAL_SLIP) {
                                                            setGlobalStake(STAKE_LIMITS.TOTAL_SLIP);
                                                        } else {
                                                            setGlobalStake(isNaN(val) ? 0 : val);
                                                        }
                                                    }}
                                                    className="w-12 bg-transparent text-right focus:outline-none text-white font-mono text-[9px]"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                            <span>Total Odds</span>
                                            <div className="text-white font-mono text-sm">
                                                {calculateTotalOdds(selections).toFixed(2)}
                                            </div>
                                        </div>

                                        {(() => {
                                            const baseWin = (betMode === 'single'
                                                ? selections.reduce((acc: number, s) => acc + ((s.stakeUsed || globalStake) * s.odds), 0)
                                                : calculateTotalOdds(selections) * globalStake
                                            );
                                            const count = selections.length;

                                            if (betMode !== 'multi' || count < MULTI_BONUS.MIN_SELECTIONS) return null;

                                            let bonusPct = 0;
                                            Object.entries(MULTI_BONUS.SCALING)
                                                .sort((a, b) => Number(b[0]) - Number(a[0]))
                                                .some(([threshold, percent]) => {
                                                    if (count >= Number(threshold)) {
                                                        bonusPct = Number(percent);
                                                        return true;
                                                    }
                                                    return false;
                                                });

                                            const bonusAmount = baseWin * (bonusPct / 100);
                                            const cappedBonus = Math.min(bonusAmount, MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);

                                            if (cappedBonus <= 0) return null;

                                            return (
                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                                    <span className="flex items-center gap-1.5 text-purple-400">
                                                        <Trophy className="h-3 w-3" />
                                                        Max Bonus ({bonusPct}%)
                                                    </span>
                                                    <div className="text-purple-400 font-mono text-sm">
                                                        + GHS {cappedBonus.toFixed(2)}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                                            <span>Potential Return</span>
                                            <div className="text-green-400 font-mono text-right flex flex-col items-end">
                                                <span className="text-sm">
                                                    GHS {(() => {
                                                        const totalStake = betMode === 'single'
                                                            ? selections.reduce((acc: number, s) => acc + (s.stakeUsed || globalStake), 0)
                                                            : globalStake;
                                                        const baseWin = betMode === 'single'
                                                            ? selections.reduce((acc: number, s) => acc + ((s.stakeUsed || globalStake) * s.odds), 0)
                                                            : calculateTotalOdds(selections) * globalStake;

                                                        // Calculate Bonus (Sporty Style)
                                                        let bonusAmount = 0;
                                                        if (betMode === 'multi' && selections.length >= MULTI_BONUS.MIN_SELECTIONS) {
                                                            let bonusPct = 0;
                                                            Object.entries(MULTI_BONUS.SCALING)
                                                                .sort((a, b) => Number(b[0]) - Number(a[0]))
                                                                .some(([threshold, percent]) => {
                                                                    if (selections.length >= Number(threshold)) {
                                                                        bonusPct = Number(percent);
                                                                        return true;
                                                                    }
                                                                    return false;
                                                                });
                                                            bonusAmount = Math.min(baseWin * (bonusPct / 100), MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);
                                                        }

                                                        const totalPotential = baseWin + bonusAmount;

                                                        // GIFT RULE: Deduct stake from winnings
                                                        const payoutDisplay = (balanceType === 'gift' ? Math.max(0, totalPotential - totalStake) : totalPotential).toFixed(2);
                                                        return payoutDisplay;
                                                    })()}
                                                </span>
                                                {balanceType === 'gift' ? (
                                                    <span className="text-[7px] text-purple-400 font-bold uppercase tracking-tighter">Profit only credited (Stake deducted)</span>
                                                ) : (
                                                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">Total Payout (Stake + Profit)</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={onPlaceBet}
                                            disabled={globalStake <= 0 && selections.every(s => !s.stakeUsed || s.stakeUsed <= 0)}
                                            className={cn(
                                                "w-full py-4 sm:py-2.5 rounded-2xl sm:rounded-xl font-black uppercase tracking-wider text-[11px] sm:text-[10px] shadow-lg transition-all active:scale-90",
                                                (globalStake > 0 || selections.some(s => s.stakeUsed && s.stakeUsed > 0))
                                                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20"
                                                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                            )}
                                        >
                                            Place Bet
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col h-full bg-slate-900">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {pendingSlips.map((slip) => (
                                            <div key={slip.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                                                            <Ticket className="h-4 w-4 text-purple-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{slip.time}</span>
                                                            <span className="text-[10px] font-black text-white">{slip.selections.length} Legs • {slip.mode}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="text-xs font-black text-accent">GHS {slip.totalStake.toFixed(2)}</div>
                                                        {slip.cashedOut && (
                                                            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[7px] font-black uppercase rounded border border-green-500/20 animate-pulse">
                                                                Cashed Out
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Selection Details */}
                                                    <div className="mt-2 space-y-1">
                                                        {slip.selections.map((sel: any, sIdx: number) => (
                                                            <div key={sIdx} className="text-[7px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                                <span className="text-white">●</span>
                                                                <span className="truncate">{[sel.schoolA, sel.schoolB, sel.schoolC].filter(Boolean).join(' vs ')}</span>
                                                                <span className="text-slate-500 italic">({sel.label})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {slip.cashedOut ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[8px] font-black uppercase rounded border border-green-500/20 animate-pulse whitespace-nowrap">
                                                            Cashed Out
                                                        </span>
                                                        <span className="text-[7px] text-slate-500 font-bold">Ref: {slip.totalStake.toFixed(2)}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmCashoutSlipId(slip.id)}
                                                        disabled={isSimulating}
                                                        className={cn(
                                                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-white bg-white/5",
                                                            isSimulating ? "opacity-30 cursor-not-allowed" : "hover:bg-red-500/20 hover:text-red-400"
                                                        )}
                                                    >
                                                        <Banknote className="h-4 w-4" />
                                                        <span className="text-[7px] font-black uppercase">Cashout</span>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {pendingSlips.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full opacity-30 py-20 text-center">
                                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                                                    <Ticket className="h-8 w-8" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-widest leading-loose">No active bets.<br />Add selections to get started!</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-white/10 bg-slate-900 flex gap-3">
                                        <button
                                            onClick={() => setSlipTab('selections')}
                                            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-wider text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Add More
                                        </button>
                                        <button
                                            onClick={onKickoff}
                                            disabled={isSimulating || pendingSlips.length === 0}
                                            className={cn(
                                                "flex-[2] py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                                                isSimulating ? "bg-slate-800 text-slate-500" :
                                                    pendingSlips.length === 0 ? "bg-slate-800 text-slate-600 cursor-not-allowed" :
                                                        "bg-purple-600 text-white shadow-purple-600/30"
                                            )}
                                        >
                                            {isSimulating ? "LIVE" : "KICKOFF"}
                                        </button>
                                    </div>

                                    {/* Confirmation Modal Overlay */}
                                    {confirmCashoutSlipId && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                                            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center text-center space-y-4">
                                                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 mb-2">
                                                    <Banknote className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-black uppercase tracking-wider text-sm mb-1">Confirm Cashout</h3>
                                                    <p className="text-slate-400 text-xs">
                                                        Refund <span className="text-white font-bold">GHS {pendingSlips.find(s => s.id === confirmCashoutSlipId)?.totalStake.toFixed(2)}</span>?
                                                        <br />This will cancel the bet.
                                                    </p>
                                                </div>
                                                <div className="flex w-full gap-2">
                                                    <button
                                                        onClick={() => setConfirmCashoutSlipId(null)}
                                                        className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={onConfirmCashout}
                                                        className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/20"
                                                    >
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div >
                    </div >
                )
            }
        </>
    )
}
