import React from "react"
import { Ticket, Zap, X, Wallet, ShieldAlert, Trophy, Banknote, ChevronLeft, Gift } from "lucide-react"
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
import { GiftSelectionModal } from "@/components/ui/GiftSelectionModal"

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
    isAuthenticated: boolean;
    gifts: any[];
    bonusId?: string;
    setBonusId: (id: string | undefined) => void;
    bonusAmount: number;
    setBonusAmount: (amount: number) => void;
    showGiftModal: boolean;
    setShowGiftModal: (show: boolean) => void;
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
    hasConflicts,
    isAuthenticated,
    gifts,
    bonusId,
    setBonusId,
    bonusAmount,
    setBonusAmount,
    showGiftModal,
    setShowGiftModal
}: VirtualsBetSlipProps) {
    return (
        <>
            {/* Quick Kickoff/Slip Bar (Fixed Bottom) */}
            {!showSlip && !isSimulationActive && (selections.length > 0 || pendingSlips.length > 0) && (
                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-slate-950/95 border-t border-white/5 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 pb-safe">
                        <button
                            onClick={() => {
                                if (pendingSlips.length > 0) {
                                    onKickoff()
                                }
                            }}
                            disabled={pendingSlips.length === 0}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 rounded-2xl px-5 py-4 transition-all active:scale-95 group relative overflow-hidden",
                                pendingSlips.length > 0
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                                    : "bg-slate-900 border border-white/10 text-slate-500 cursor-not-allowed opacity-80"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Zap className={cn("h-5 w-5", pendingSlips.length > 0 && "fill-white/20 animate-pulse")} />
                            <div className="flex flex-col items-start leading-none text-left">
                                <span className={cn("text-[11px] font-black uppercase tracking-tighter", pendingSlips.length === 0 && "text-slate-400")}>
                                    Kickoff
                                </span>
                                <span className={cn("text-[8px] font-bold uppercase tracking-widest mt-0.5", pendingSlips.length > 0 ? "text-red-200" : "text-slate-600")}>
                                    {pendingSlips.length > 0 ? `${pendingSlips.length} Bets Ready` : "No Active Bets"}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setShowSlip(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-2xl shadow-lg shadow-purple-600/20 transition-all active:scale-90 group relative flex flex-col items-center justify-center min-w-[120px]"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-2 mb-0.5 relative">
                                <Ticket className="h-4 w-4" />
                                <span className="text-[11px] font-black uppercase tracking-tighter">Bet Slip</span>
                                {selections.length > 0 && (
                                    <span className="absolute -top-2 -right-4 bg-white text-[8px] font-black text-purple-600 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-purple-600">
                                        {selections.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-bold opacity-80 uppercase tracking-widest leading-none mt-1">
                                {selections.length > 0 ? "Place Bet" : "Open Slip"}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Instant Slip Overlay (The Modal-like View) */}
            <div className={cn(
                "fixed inset-0 z-[100] bg-slate-950 flex flex-col transition-transform duration-500 ease-in-out",
                showSlip ? "translate-y-0" : "translate-y-[100%]"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-purple-500 fill-purple-500/20" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Instant Slip</h2>
                    </div>
                    <button onClick={() => setShowSlip(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-slate-900/30">
                    <button
                        onClick={() => setSlipTab('selections')}
                        className={cn(
                            "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
                            slipTab === 'selections' ? "text-purple-400" : "text-slate-500"
                        )}>
                        Selections ({selections.length})
                        {slipTab === 'selections' && <div className="absolute bottom-0 inset-x-0 h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                    <button
                        onClick={() => setSlipTab('pending')}
                        className={cn(
                            "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
                            slipTab === 'pending' ? "text-purple-400" : "text-slate-500"
                        )}>
                        Active Bets ({pendingSlips.length})
                        {slipTab === 'pending' && <div className="absolute bottom-0 inset-x-0 h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                    </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {slipTab === 'selections' ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {selections.length > 0 ? (
                                <>
                                    {/* Scrollable Selections Container */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-2">
                                        {/* Wallet / Balance Info */}
                                        <div className="flex gap-2 mb-4 px-4">
                                            <button
                                                onClick={() => setBalanceType('cash')}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all",
                                                    balanceType === 'cash' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Wallet className={cn("h-3 w-3", balanceType === 'cash' ? "text-green-500" : "text-slate-500")} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cash Balance</span>
                                                </div>
                                                <span className={cn("text-sm font-black font-mono", balanceType === 'cash' ? "text-white" : "text-slate-500")}>
                                                    GHS {(profile?.balance || 0).toFixed(2)}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setBalanceType('gift')}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-2xl border flex flex-col items-center justify-center transition-all",
                                                    balanceType === 'gift' ? "bg-purple-500/10 border-purple-500/40" : "bg-slate-800/40 border-white/5 opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Zap className={cn("h-3 w-3", balanceType === 'gift' ? "text-purple-400" : "text-slate-500")} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Gift Vouchers</span>
                                                </div>
                                                <span className={cn("text-sm font-black font-mono", balanceType === 'gift' ? "text-purple-300" : "text-slate-500")}>
                                                    GHS {(profile?.bonusBalance || 0).toFixed(2)}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Gift Selection Overlay */}
                                        {balanceType === 'gift' && (
                                            <div className="px-4 mb-4">
                                                <button
                                                    onClick={() => setShowGiftModal(true)}
                                                    className={cn(
                                                        "w-full py-3 px-4 rounded-xl border flex items-center justify-between transition-all bg-slate-900 border-white/5",
                                                        bonusId ? "ring-2 ring-purple-500/30 bg-purple-950/20 shadow-lg" : "opacity-80"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Gift className={cn("h-5 w-5", bonusId ? "text-purple-400" : "text-slate-500")} />
                                                        <div className="flex flex-col items-start leading-none">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                                {bonusId ? "GIFT ACTIVE" : "SELECT GIFT"}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                                {bonusId ? `REF: #${bonusId.slice(-6)}` : "TAP TO CHOOSE VOUCHER"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                                        <ChevronLeft className="h-4 w-4 text-slate-500 rotate-180" />
                                                    </div>
                                                </button>
                                            </div>
                                        )}

                                        {/* Mode Toggle */}
                                        <div className="flex bg-slate-900 rounded-xl p-1.5 border border-white/10 mb-4 mx-4 shadow-inner">
                                            {(['single', 'multi'] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setBetMode(mode)}
                                                    className={cn(
                                                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                                        betMode === mode
                                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                                            : "text-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    {mode} Slip
                                                </button>
                                            ))}
                                        </div>

                                        {/* Selections List */}
                                        <div className="px-4 space-y-2">
                                            {selections.map((sel) => (
                                                <div
                                                    key={sel.selectionId}
                                                    className="bg-slate-900/50 rounded-2xl border border-white/5 group relative transition-all hover:bg-slate-900"
                                                >
                                                    <button
                                                        onClick={() => toggleSelection(sel)}
                                                        className="absolute -top-1.5 -right-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-500 hover:text-red-400 w-6 h-6 rounded-full flex items-center justify-center border border-white/5 transition-colors z-10"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>

                                                    <div onClick={() => {
                                                        const m = matches.find(m => m.id === sel.matchId);
                                                        if (m) { setSelectedMatchForDetails(m); setShowSlip(false); }
                                                    }} className="p-4 cursor-pointer">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{sel.marketName}</span>
                                                                <span className="text-[11px] font-black text-white mt-0.5">{sel.label}</span>
                                                            </div>
                                                            <div className="text-xl font-black text-accent font-mono">{sel.odds.toFixed(2)}</div>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                            {[sel.schoolA, sel.schoolB, sel.schoolC].filter(Boolean).join(' vs ')}
                                                        </div>

                                                        {betMode === 'single' && (
                                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between bg-black/20 -mx-4 -mb-4 px-4 pb-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-500 uppercase">Input Stake</span>
                                                                    <span className="text-[7px] font-bold text-slate-600 uppercase">Limit {sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-white/5 focus-within:border-purple-500/40 transition-all">
                                                                    <span className="text-[10px] text-slate-500 font-black">GHS</span>
                                                                    <input
                                                                        type="number"
                                                                        value={sel.stakeUsed || ""}
                                                                        placeholder="1.00"
                                                                        onChange={(e) => {
                                                                            const val = parseFloat(e.target.value);
                                                                            const limit = sel.marketName === "Match Winner" ? STAKE_LIMITS.MATCH_WINNER : STAKE_LIMITS.PROPS;
                                                                            const cappedVal = isNaN(val) ? 0 : Math.min(val, limit);
                                                                            setSelections(prev => prev.map(s => s.selectionId === sel.selectionId ? { ...s, stakeUsed: cappedVal } : s));
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-16 bg-transparent text-right focus:outline-none text-white font-black text-xs"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pinned Summary Footer */}
                                    <div className="bg-slate-900 border-t border-white/10 p-4 space-y-3 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
                                        {hasConflicts && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                                                <p className="text-[9px] font-black text-red-400 uppercase tracking-wider">Correlated markets: Singles only</p>
                                            </div>
                                        )}

                                        {/* Global Stake for Multi */}
                                        {selections.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{betMode === 'multi' ? "Selection Stake" : "Quick Stake All"}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Slip Limit GHS {STAKE_LIMITS.TOTAL_SLIP}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10 focus-within:border-purple-500/50 transition-all">
                                                    <span className="text-xs text-slate-500 font-black">GHS</span>
                                                    <input
                                                        type="number"
                                                        value={globalStake || ""}
                                                        placeholder="1.00"
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (val > STAKE_LIMITS.TOTAL_SLIP) {
                                                                setGlobalStake(STAKE_LIMITS.TOTAL_SLIP);
                                                            } else {
                                                                setGlobalStake(isNaN(val) ? 0 : val);
                                                            }
                                                        }}
                                                        className="w-20 bg-transparent text-right focus:outline-none text-white font-black text-base"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Odds</span>
                                                <span className="text-xl font-black text-white font-mono leading-none">{calculateTotalOdds(selections).toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Potential Return</span>
                                                <div className="flex flex-col items-end leading-none">
                                                    <span className="text-xl font-black text-green-400 font-mono">
                                                        GHS {(() => {
                                                            const totalStake = betMode === 'single' ? selections.reduce((acc, s) => acc + (s.stakeUsed || globalStake), 0) : globalStake;
                                                            const baseWin = betMode === 'single' ? selections.reduce((acc, s) => acc + ((s.stakeUsed || globalStake) * s.odds), 0) : calculateTotalOdds(selections) * globalStake;
                                                            let bAmt = 0;
                                                            if (betMode === 'multi' && selections.length >= MULTI_BONUS.MIN_SELECTIONS) {
                                                                let bPct = 0;
                                                                Object.entries(MULTI_BONUS.SCALING).sort((a, b) => Number(b[0]) - Number(a[0])).some(([th, pc]) => { if (selections.length >= Number(th)) { bPct = Number(pc); return true; } return false; });
                                                                bAmt = Math.min(baseWin * (bPct / 100), MULTI_BONUS.MAX_BONUS_AMOUNT_CAP);
                                                            }
                                                            const totalPotential = baseWin + bAmt;
                                                            return (balanceType === 'gift' ? Math.max(0, totalPotential - totalStake) : totalPotential).toFixed(2);
                                                        })()}
                                                    </span>
                                                    <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{balanceType === 'gift' ? "Commission Deducted" : "Stake Included"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!isAuthenticated ? (
                                            <button onClick={() => window.location.href = '/auth/login'} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-purple-900/40 active:scale-[0.98] transition-all">
                                                Login to Place Bet
                                            </button>
                                        ) : (
                                            <button
                                                onClick={onPlaceBet}
                                                disabled={globalStake <= 0 && selections.every(s => !s.stakeUsed || s.stakeUsed <= 0)}
                                                className={cn(
                                                    "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-[0.98] border-t border-white/10",
                                                    (globalStake > 0 || selections.some(s => s.stakeUsed && s.stakeUsed > 0))
                                                        ? "bg-purple-600 text-white shadow-purple-600/30"
                                                        : "bg-slate-800 text-slate-600 cursor-not-allowed"
                                                )}
                                            >
                                                Place Bet
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30 px-10 text-center">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <Ticket className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">Your slip is empty</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Add some virtual matches to get started</p>
                                    </div>
                                    <button onClick={() => setShowSlip(false)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Return to Matches</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {pendingSlips.map((slip) => (
                                    <div key={slip.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-500/20">
                                                    <Ticket className="h-4 w-4 text-purple-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white">{slip.selections.length} Legs • {slip.mode}</span>
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">GHS {slip.totalStake.toFixed(2)} Staked</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {slip.selections.map((sel: any, sIdx: number) => (
                                                    <div key={sIdx} className="text-[8px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-purple-500" />
                                                        <span className="truncate flex-1">{[sel.schoolA, sel.schoolB, sel.schoolC].filter(Boolean).join(' vs ')}</span>
                                                        <span className="text-slate-600 italic">({sel.label})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {slip.cashedOut ? (
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-center">
                                                <span className="text-[8px] font-black text-green-500 uppercase block leading-none">Cashed Out</span>
                                                <span className="text-[7px] text-green-600 font-bold block mt-1">Ref: {slip.totalStake.toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmCashoutSlipId(slip.id)}
                                                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-white/5 flex flex-col items-center justify-center transition-all active:scale-90"
                                            >
                                                <Banknote className="h-4 w-4" />
                                                <span className="text-[6px] font-black uppercase mt-1">Cash</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {pendingSlips.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-20 text-center scale-90">
                                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center mb-4">
                                            <Ticket className="h-8 w-8" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-widest leading-loose">No active bets</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-white/10 bg-slate-950 flex gap-3 pb-safe">
                                <button
                                    onClick={() => setSlipTab('selections')}
                                    className="flex-[0.5] py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-white/5"
                                >
                                    Add More
                                </button>
                                <button
                                    onClick={onKickoff}
                                    disabled={isSimulating || pendingSlips.length === 0}
                                    className={cn(
                                        "flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3",
                                        isSimulating ? "bg-slate-800 text-slate-500" :
                                            pendingSlips.length === 0 ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5" :
                                                "bg-purple-600 text-white shadow-purple-600/20 border-t border-white/10"
                                    )}
                                >
                                    <Zap className={cn("h-4 w-4", !isSimulating && pendingSlips.length > 0 && "animate-pulse")} />
                                    {isSimulating ? "SIMULATING..." : "START KICKOFF"}
                                </button>
                            </div>

                            {/* Confirmation Overlay */}
                            {confirmCashoutSlipId && (
                                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-xs shadow-2xl flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                                            <ShieldAlert className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-white font-black uppercase tracking-[0.2em] text-base mb-2">Cancel Bet?</h3>
                                        <p className="text-slate-400 text-[11px] font-bold leading-relaxed mb-8">
                                            Confirm cashout of <span className="text-white">GHS {pendingSlips.find(s => s.id === confirmCashoutSlipId)?.totalStake.toFixed(2)}</span>? Slip will be cancelled.
                                        </p>
                                        <div className="flex w-full gap-3">
                                            <button onClick={() => setConfirmCashoutSlipId(null)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-black uppercase tracking-widest text-[10px] hover:bg-slate-750">No</button>
                                            <button onClick={onConfirmCashout} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-900/40">Yes, Cashout</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Gift Modal */}
            <GiftSelectionModal
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                gifts={gifts}
                bonusId={bonusId}
                totalOdds={calculateTotalOdds(selections)}
                selectionsCount={selections.length}
                totalStake={betMode === 'single' ? (globalStake * selections.length) : globalStake}
                onApply={(gid: string | undefined, amt: number) => {
                    setBonusId(gid)
                    setBonusAmount(amt)
                }}
            />
        </>
    )
}
