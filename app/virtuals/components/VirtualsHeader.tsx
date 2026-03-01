import React from "react"
import { ArrowLeft, Wallet, Zap, Ticket, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface VirtualsHeaderProps {
    onBack: () => void;
    selectedCategory: 'all' | 'regional' | 'national';
    onCategoryChange: (category: 'all' | 'regional' | 'national') => void;
    setSelectedRegion: (region: string | null) => void; // Reset region when category changes
    balanceType: 'cash' | 'gift';
    onBalanceTypeChange: (type: 'cash' | 'gift') => void;
    balance: number;
    bonusBalance: number;
    hasPendingBets: boolean;
    onOpenHistory: () => void;
    availableRegions: string[]; // Passed for logic if needed, though mostly used in resetting
    isSimulationActive?: boolean;
    onSkip?: () => void;
    isAuthenticated: boolean;
    user?: { id?: string; email?: string; name?: string | null };
    onNextRound: () => void;
    disableSkip?: boolean;
    customSubNavNode?: React.ReactNode;
}

export function VirtualsHeader({
    onBack,
    selectedCategory,
    onCategoryChange,
    setSelectedRegion,
    balanceType,
    onBalanceTypeChange,
    balance,
    bonusBalance,
    hasPendingBets,
    onOpenHistory,
    availableRegions,
    isSimulationActive,
    onSkip,
    isAuthenticated,
    user,
    onNextRound,
    disableSkip,
    customSubNavNode
}: VirtualsHeaderProps) {
    return (
        <div className="bg-slate-900 shadow-lg border-b border-white/5 sticky top-0 z-50 transition-all duration-300">
            {/* Top Row: Navigation & Actions */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 md:border-b-0">
                <div className="flex items-center gap-3">
                    {!isSimulationActive ? (
                        <button
                            onClick={onBack}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-90 border border-white/5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onSkip}
                            disabled={disableSkip}
                            className={cn(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg animate-in fade-in",
                                disableSkip
                                    ? "bg-slate-800 text-white/30 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-500 text-white active:scale-95"
                            )}
                        >
                            Skip
                        </button>
                    )}
                    <div className="h-6 w-px bg-white/10 hidden md:block" />
                    <span className="font-display font-black text-xs md:text-sm text-primary tracking-widest uppercase ml-1">
                        INSTANT VIRTUALS
                    </span>
                </div>

                {/* Desktop Category Selector or Custom Node */}
                {customSubNavNode ? (
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        {customSubNavNode}
                    </div>
                ) : (
                    <div className={cn("hidden md:flex items-center gap-2", isSimulationActive && "opacity-20 pointer-events-none")}>
                        {(['all', 'national', 'regional'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    onCategoryChange(cat);
                                    if (cat === 'regional' && availableRegions.length > 0) setSelectedRegion(availableRegions[0]);
                                    else setSelectedRegion(null);
                                }}
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border",
                                    selectedCategory === cat
                                        ? "bg-purple-600 border-purple-400 text-white shadow-lg"
                                        : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            {/* Compact Balance Toggle for small screens */}
                            <div className="flex items-center bg-slate-950/50 rounded-xl p-0.5 border border-white/5">
                                <button
                                    onClick={() => onBalanceTypeChange('cash')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all",
                                        balanceType === 'cash' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500"
                                    )}
                                >
                                    <Wallet className="h-3 w-3" />
                                    <span className="text-[10px] font-black font-mono">{balance.toFixed(2)}</span>
                                </button>
                                <button
                                    onClick={() => onBalanceTypeChange('gift')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all",
                                        balanceType === 'gift' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500"
                                    )}
                                >
                                    <Zap className="h-3 w-3" />
                                    <span className="text-[10px] font-black font-mono">{bonusBalance.toFixed(2)}</span>
                                </button>
                            </div>

                            {!isSimulationActive && (
                                <button
                                    onClick={onOpenHistory}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all relative active:scale-90 border border-white/5"
                                >
                                    <Ticket className="h-4 w-4" />
                                    {hasPendingBets && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-600 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                        </span>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => window.location.href = '/auth/login'}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all active:scale-95"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Row: Mobile Category Selector or Custom Node */}
            {customSubNavNode ? (
                <div className="md:hidden w-full flex items-center justify-center p-2 border-b border-white/5 bg-slate-900/50">
                    {customSubNavNode}
                </div>
            ) : (
                <div className={cn(
                    "md:hidden flex items-center gap-2 px-4 py-2 border-b border-white/5 overflow-x-auto no-scrollbar bg-slate-900/50",
                    isSimulationActive && "opacity-20 pointer-events-none"
                )}>
                    {(['all', 'national', 'regional'] as const).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                onCategoryChange(cat);
                                if (cat === 'regional' && availableRegions.length > 0) setSelectedRegion(availableRegions[0]);
                                else setSelectedRegion(null);
                            }}
                            className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl transition-all border whitespace-nowrap flex-1",
                                selectedCategory === cat
                                    ? "bg-purple-600 border-purple-400 text-white shadow-lg"
                                    : "bg-slate-900/60 border-white/5 text-slate-500"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
