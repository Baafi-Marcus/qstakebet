"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BetSlipContext } from "@/lib/store/context"
import { X, Loader2 } from "lucide-react"
import { bets } from "@/lib/db/schema"
import { placeBet } from "@/lib/bet-actions"

import { Zap, Ticket, History, ChevronLeft, ArrowRight, Wallet, Info } from "lucide-react"

export function BetSlipSidebar() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState("")
    const [wallet, setWallet] = React.useState<{ balance: number, bonusBalance: number } | null>(null)
    const [slipTab, setSlipTab] = React.useState<'selections' | 'pending'>('selections')
    const [betMode, setBetMode] = React.useState<'single' | 'multi'>('multi')
    const [userBets, setUserBets] = React.useState<typeof bets.$inferSelect[]>([])
    const context = React.useContext(BetSlipContext)

    const selections = context?.selections || []
    const removeSelection = context?.removeSelection || (() => { })
    const clearSlip = context?.clearSlip || (() => { })
    const stake = context?.stake || 10
    const setStake = context?.setStake || (() => { })
    const updateSelectionStake = context?.updateSelectionStake || (() => { })
    const isOpen = context?.isOpen || false
    const closeSlip = context?.closeSlip || (() => { })
    const useBonus = context?.useBonus || false
    const setUseBonus = context?.setUseBonus || (() => { })

    // Fetch wallet and bets
    React.useEffect(() => {
        if (isOpen) {
            import("@/lib/wallet-actions").then(m => {
                m.getUserWalletBalance().then(w => setWallet(w))
            })
            // Fetch real money bets
            fetch("/api/user/bets").then(res => res.json()).then(data => {
                if (data.success) setUserBets(data.bets)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }).catch(_err => console.error("Failed to fetch bets"))
        }
    }, [isOpen])

    const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)

    // Calculate potential win based on mode
    const calculatePotentialWin = () => {
        if (betMode === 'single') {
            return selections.reduce((acc, s) => {
                const sStake = s.stake || stake
                const p = useBonus ? (sStake * s.odds) - sStake : sStake * s.odds
                return acc + p
            }, 0)
        }
        return useBonus ? (stake * totalOdds) - stake : stake * totalOdds
    }

    const totalStake = betMode === 'single'
        ? selections.reduce((acc, s) => acc + (s.stake || stake), 0)
        : stake

    const potentialWin = calculatePotentialWin()

    return (
        <>
            {/* Unified Animated Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/90 backdrop-blur-md z-[80] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={closeSlip}
            />

            {/* Sidebar Content - Refined for "Instant Slip" feel */}
            <div
                className={cn(
                    "bg-slate-950 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-[90] fixed shadow-2xl overflow-hidden border-white/5",
                    // Mobile: Full screen/Bottom sheet
                    "bottom-0 left-0 right-0 h-full md:h-[90vh] rounded-t-[2.5rem] md:border-t",
                    isOpen ? "translate-y-0" : "translate-y-full",
                    // Desktop: Side drawer
                    "lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:h-screen lg:w-[420px] lg:rounded-none lg:border-l lg:translate-y-0",
                    isOpen ? "lg:translate-x-0" : "lg:translate-x-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-sm uppercase tracking-[0.2em] leading-none mb-1">QSTAKE SLIP</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Premium Betting</p>
                        </div>
                    </div>
                    <button
                        onClick={closeSlip}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all active:scale-90"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tab Switcher - Same as Virtuals */}
                <div className="px-4 py-3 grid grid-cols-2 gap-2 bg-slate-950/80">
                    <button
                        onClick={() => setSlipTab('selections')}
                        className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center justify-center gap-3",
                            slipTab === 'selections'
                                ? "bg-white/10 text-white shadow-xl border border-white/10"
                                : "text-slate-500 hover:text-slate-400"
                        )}
                    >
                        Selections
                        {selections.length > 0 && (
                            <span className="w-5 h-5 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                                {selections.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setSlipTab('pending')}
                        className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center justify-center gap-3",
                            slipTab === 'pending'
                                ? "bg-white/10 text-white shadow-xl border border-white/10"
                                : "text-slate-500 hover:text-slate-400"
                        )}
                    >
                        My Bets
                        {userBets.length > 0 && (
                            <span className="w-5 h-5 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center text-[10px] font-black">
                                {userBets.length}
                            </span>
                        )}
                    </button>
                </div>

                {slipTab === 'selections' ? (
                    <>
                        {/* Mode Toggle (Single/Multi) */}
                        <div className="p-2 grid grid-cols-2 gap-2 bg-black/20 mx-4 rounded-2xl border border-white/5">
                            {['single', 'multi'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setBetMode(mode as 'single' | 'multi')}
                                    className={cn(
                                        "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        betMode === mode
                                            ? "bg-primary text-white shadow-xl"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {selections.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                                <div className="w-20 h-20 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                                    <Ticket className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="font-black text-white text-sm uppercase tracking-widest">No Selections</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">
                                    Add some matches to start building your winning ticket
                                </p>
                                <button
                                    onClick={closeSlip}
                                    className="mt-10 px-10 py-4 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Continue Betting
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Items ({selections.length})</span>
                                        <button onClick={clearSlip} className="text-[9px] font-black text-red-500 uppercase tracking-widest">Clear All</button>
                                    </div>
                                    {selections.map((item) => (
                                        <div key={item.selectionId} className="bg-white/5 rounded-3xl p-5 relative group border border-white/5 hover:border-primary/30 transition-all">
                                            <button
                                                onClick={() => removeSelection(item.selectionId)}
                                                className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.1em] mb-1.5 leading-none">{item.marketName}</div>
                                                    <div className="text-sm font-black text-white mb-1 leading-tight pr-6">{item.label}</div>
                                                    <div className="text-[11px] font-bold text-slate-500 leading-tight">{item.matchLabel}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-slate-600 uppercase mb-1 leading-none">Odds</div>
                                                    <div className="font-black text-accent text-lg font-mono tracking-tighter">{item.odds.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Single Stake Input per selection */}
                                            {betMode === 'single' && (
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stake (GHS)</span>
                                                    <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                                                        <span className="text-[10px] font-bold text-slate-600">GHS</span>
                                                        <input
                                                            type="number"
                                                            value={item.stake || stake}
                                                            onChange={(e) => updateSelectionStake(item.selectionId, Math.max(0, Number(e.target.value)))}
                                                            className="w-16 bg-transparent text-right font-black text-sm text-white focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 border-t border-white/5 bg-slate-950/80 backdrop-blur-2xl space-y-6 pb-12">
                                    {/* Bonus Toggle */}
                                    {wallet && wallet.bonusBalance > 0 && (
                                        <div className={cn(
                                            "flex items-center justify-between p-4 rounded-3xl border transition-all",
                                            useBonus
                                                ? "bg-blue-600/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                                                : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                                    <Wallet className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Bonus GHS {wallet.bonusBalance.toFixed(2)}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest uppercase">Use Bonus Credits</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setUseBonus(!useBonus)}
                                                className={cn(
                                                    "relative inline-flex h-7 w-12 items-center rounded-2xl transition-all outline-none",
                                                    useBonus ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "bg-slate-800"
                                                )}
                                            >
                                                <span className={cn(
                                                    "inline-block h-5 w-5 transform rounded-xl bg-white transition-all shadow-md",
                                                    useBonus ? "translate-x-6" : "translate-x-1"
                                                )} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Main Stake Input (Multi mode) */}
                                    {betMode === 'multi' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Stake (GHS)</label>
                                                <span className="text-[10px] font-bold text-slate-600 tracking-widest">MIN 1.00</span>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm tracking-widest">GHS</div>
                                                <input
                                                    type="number"
                                                    value={stake}
                                                    onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                                                    className="w-full bg-white/5 border border-white/5 rounded-3xl pl-16 pr-8 py-5 text-right font-black text-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Ticket Summary */}
                                    <div className="space-y-3 bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            <span>Total Odds</span>
                                            <span className="text-white text-base font-mono">{totalOdds.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                            <span>Total Stake</span>
                                            <span className="text-white text-base font-mono">GHS {totalStake.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Potential Win</span>
                                                {useBonus && (
                                                    <div className="flex items-center gap-1.5 bg-blue-400/10 px-2 py-1 rounded-lg">
                                                        <Info className="h-3 w-3 text-blue-400" />
                                                        <span className="text-[8px] text-blue-400 font-black uppercase tracking-widest">SNR Applied</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-black text-accent text-3xl font-mono tracking-tighter">
                                                GHS {potentialWin.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (isProcessing) return
                                            // Handle multi-mode betting appropriately
                                            // Currently server-side placeBet might only handle Multi/Single Selection
                                            // Need to ensure placeBet can handle multiple "Single" bets in one go if that's the intention
                                            setIsProcessing(true)
                                            setError("")
                                            try {
                                                // Simplified: Place multiple bets if 'single' mode
                                                if (betMode === 'single') {
                                                    for (const sel of selections) {
                                                        await placeBet(sel.stake || stake, [sel], useBonus)
                                                    }
                                                    clearSlip()
                                                    setUseBonus(false)
                                                    closeSlip()
                                                    window.location.reload()
                                                } else {
                                                    const result = await placeBet(stake, selections, useBonus)
                                                    if (result.success) {
                                                        clearSlip()
                                                        setUseBonus(false)
                                                        closeSlip()
                                                        window.location.reload()
                                                    } else {
                                                        const resultWithError = result as { success: false; error: string }
                                                        setError(resultWithError.error || "Failed to place bet")
                                                    }
                                                }
                                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                            } catch (_err) {
                                                setError("A system error occurred")
                                            } finally {
                                                setIsProcessing(false)
                                            }
                                        }}
                                        disabled={isProcessing || totalStake < 1}
                                        className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-900 disabled:text-slate-700 text-white font-black h-20 rounded-[2.5rem] shadow-2xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm"
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Processing Slip...</span>
                                            </div>
                                        ) : (
                                            <>Place {betMode} Bet <ArrowRight className="h-4 w-4" /></>
                                        )}
                                    </button>

                                    {error && (
                                        <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-[0.2em] animate-pulse">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col p-4 bg-slate-950">
                        {userBets.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                                <div className="w-20 h-20 bg-slate-900/50 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                                    <History className="h-10 w-10 opacity-20" />
                                </div>
                                <p className="font-black text-white text-sm uppercase tracking-widest">No Active Bets</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                    Your betting history will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto custom-scrollbar">
                                {userBets.map((bet) => (
                                    <div key={bet.id} className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                    {bet.createdAt ? new Date(bet.createdAt).toLocaleString() : 'Date N/A'}
                                                </div>
                                                <div className="text-sm font-black text-white uppercase tracking-widest">
                                                    Ticket #{bet.id?.split('-')[1]?.toUpperCase() || 'ID N/A'}
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                bet.status === 'won' ? "bg-green-500/20 text-green-400" :
                                                    bet.status === 'lost' ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                                            )}>
                                                {bet.status || 'pending'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Stake</div>
                                                <div className="text-white font-mono font-black">GHS {bet.stake.toFixed(2)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Return</div>
                                                <div className={cn("font-mono font-black", (bet.status === 'won' ? "text-accent" : "text-white/20"))}>
                                                    GHS {bet.potentialPayout.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 p-4">
                            <button
                                onClick={() => setSlipTab('selections')}
                                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:bg-white/10"
                            >
                                <ChevronLeft className="h-4 w-4" /> Go Back to Selections
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
