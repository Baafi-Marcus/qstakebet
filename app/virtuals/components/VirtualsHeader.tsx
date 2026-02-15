import React from "react"
import { ArrowLeft, Wallet, Zap, Ticket } from "lucide-react"
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
    availableRegions
}: VirtualsHeaderProps) {
    return (
        <div className="flex items-center bg-slate-900 shadow-lg border-b border-white/5 sticky top-0 z-50 py-3 px-4 gap-4">
            {/* Left: Back Button */}
            <button
                onClick={onBack}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors shrink-0"
            >
                <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="h-6 w-px bg-white/10 shrink-0" />

            {/* Middle: Category Selector */}
            <div className="flex-1 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            onCategoryChange('all');
                            setSelectedRegion(null);
                        }}
                        className={cn(
                            "text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl whitespace-nowrap border",
                            selectedCategory === 'all'
                                ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => {
                            onCategoryChange('national');
                            setSelectedRegion(null);
                        }}
                        className={cn(
                            "text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl whitespace-nowrap border",
                            selectedCategory === 'national'
                                ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                    >
                        National
                    </button>
                    <button
                        onClick={() => {
                            onCategoryChange('regional');
                            if (availableRegions.length > 0) {
                                setSelectedRegion(availableRegions[0]);
                            }
                        }}
                        className={cn(
                            "text-xs font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl whitespace-nowrap border",
                            selectedCategory === 'regional'
                                ? "bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20"
                                : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                        )}
                    >
                        Regional
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 pl-2 border-l border-white/10">
                {/* Balance Display */}
                <div
                    onClick={() => onBalanceTypeChange('cash')}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all cursor-pointer active:scale-95",
                        balanceType === 'cash' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-slate-950/30 border-white/5 opacity-60"
                    )}
                >
                    <Wallet className={cn("h-3 w-3", balanceType === 'cash' ? "text-green-500" : "text-slate-400")} />
                    <span className={cn("text-xs font-black font-mono", balanceType === 'cash' ? "text-white" : "text-slate-500")}>
                        {balance.toFixed(2)}
                    </span>
                </div>

                <div
                    onClick={() => onBalanceTypeChange('gift')}
                    className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1.5 border transition-all cursor-pointer active:scale-95",
                        balanceType === 'gift' ? "bg-purple-500/10 border-purple-500/40" : "bg-slate-950/30 border-white/5 opacity-60"
                    )}
                >
                    <Zap className={cn("h-3 w-3", balanceType === 'gift' ? "text-purple-400" : "text-slate-500")} />
                    <span className={cn("text-xs font-black font-mono", balanceType === 'gift' ? "text-purple-300" : "text-slate-500")}>
                        {bonusBalance.toFixed(2)}
                    </span>
                </div>

                <button
                    onClick={onOpenHistory}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors relative"
                >
                    <Ticket className="h-4 w-4" />
                    {/* Dot indicator if active bets exist? */}
                    {hasPendingBets && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-slate-900" />
                    )}
                </button>
            </div>
        </div>
    )
}
