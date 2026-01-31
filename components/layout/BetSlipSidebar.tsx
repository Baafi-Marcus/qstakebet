"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BetSlipContext } from "@/lib/store/context"
import { X, Loader2 } from "lucide-react"
import { placeBet } from "@/lib/bet-actions"

export function BetSlipSidebar() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState("")
    const [wallet, setWallet] = React.useState<{ balance: number, bonusBalance: number } | null>(null)
    const context = React.useContext(BetSlipContext)

    const selections = context?.selections || []
    const removeSelection = context?.removeSelection || (() => { })
    const clearSlip = context?.clearSlip || (() => { })
    const stake = context?.stake || 10
    const setStake = context?.setStake || (() => { })
    const isOpen = context?.isOpen || false
    const closeSlip = context?.closeSlip || (() => { })
    const useBonus = context?.useBonus || false
    const setUseBonus = context?.setUseBonus || (() => { })

    React.useEffect(() => {
        if (isOpen) {
            import("@/lib/wallet-actions").then(m => {
                m.getUserWalletBalance().then(w => setWallet(w))
            })
        }
    }, [isOpen])

    const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)
    const potentialWin = useBonus ? (stake * totalOdds) - stake : stake * totalOdds

    return (
        <>
            {/* Unified Animated Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={closeSlip}
            />

            {/* Sidebar Content - With Smooth Transitions */}
            <div
                className={cn(
                    "bg-card flex flex-col transition-all duration-300 ease-in-out z-[90] fixed shadow-2xl overflow-hidden",
                    // Mobile: Bottom sheet
                    "bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl border-t border-white/10",
                    isOpen ? "translate-y-0" : "translate-y-full",
                    // Desktop: Horizontal Side Drawer
                    "lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:h-screen lg:w-[400px] lg:rounded-none lg:border-l lg:border-border lg:translate-y-0",
                    isOpen ? "lg:translate-x-0" : "lg:translate-x-full"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with improved hit areas */}
                <div className="flex items-center justify-between px-2 py-3 border-b border-border bg-secondary/20 rounded-t-2xl lg:rounded-none">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={closeSlip}
                            className="p-3 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors"
                            aria-label="Close bet slip"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h3 className="font-bold text-foreground">
                            Bet Slip
                            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full ml-2 border border-primary/20">
                                {selections.length}
                            </span>
                        </h3>
                    </div>

                    <button
                        onClick={clearSlip}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                {selections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <X className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="font-bold text-sm">Your bet slip is empty</p>
                        <p className="text-xs opacity-50 mt-1">Add some selections from the match list to place a bet.</p>
                        <button
                            onClick={closeSlip}
                            className="mt-8 px-8 py-3 bg-secondary rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                            Continue Betting
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {selections.map((item) => (
                                <div key={item.selectionId} className="bg-secondary/30 rounded-2xl p-4 relative group border border-white/5 hover:border-slate-700 transition-all">
                                    <button
                                        onClick={() => removeSelection(item.selectionId)}
                                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 opacity-70">{item.marketName}</div>
                                    <div className="text-sm font-black text-white pr-8 mb-1">{item.label}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.matchLabel}</div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Odds</span>
                                        <span className="font-black text-accent text-base font-display">{item.odds.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-border bg-slate-950/40 backdrop-blur-xl space-y-5 pb-safe">
                            {/* Wallet Info & Bonus Toggle */}
                            {wallet && wallet.bonusBalance > 0 && (
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                    useBonus
                                        ? "bg-blue-600/10 border-blue-500/30"
                                        : "bg-slate-900/40 border-white/5 opacity-60 hover:opacity-100"
                                )}>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Bonus Balance</span>
                                        <span className="text-sm font-black text-white">GHS {wallet.bonusBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Use Bonus</span>
                                        <button
                                            onClick={() => setUseBonus(!useBonus)}
                                            className={cn(
                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                                useBonus ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "bg-slate-700"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                                                    useBonus ? "translate-x-6" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stake (GHS)</label>
                                    <span className="text-[10px] font-bold text-slate-400">Min 1.00</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={stake}
                                        onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-4 text-center font-black text-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-display"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-70">Potential Payout</span>
                                    {useBonus && (
                                        <span className="text-[8px] text-blue-400 font-bold uppercase tracking-tight bg-blue-500/10 px-1.5 py-0.5 rounded leading-none">Stake Not Returned</span>
                                    )}
                                </div>
                                <span className="font-black text-accent text-2xl font-display tracking-tight">
                                    GHS {potentialWin.toFixed(2)}
                                </span>
                            </div>

                            <button
                                onClick={async () => {
                                    if (isProcessing) return
                                    if (useBonus && wallet && wallet.bonusBalance < stake) {
                                        setError("Insufficient bonus balance")
                                        return
                                    }
                                    if (!useBonus && wallet && wallet.balance < stake) {
                                        setError("Insufficient balance")
                                        return
                                    }

                                    setIsProcessing(true)
                                    setError("")
                                    try {
                                        const result = await placeBet(stake, selections, useBonus)
                                        if (result.success) {
                                            clearSlip()
                                            setUseBonus(false)
                                            closeSlip()
                                            // Optional: Show success animation before reload
                                            window.location.reload()
                                        } else {
                                            const res = result as { success: false; error: string }
                                            setError(res.error || "Failed to place bet")
                                        }
                                    } catch {
                                        setError("A network error occurred")
                                    } finally {
                                        setIsProcessing(false)
                                    }
                                }}
                                disabled={isProcessing || stake < 1}
                                className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-sm"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    <>Place Bet • GHS {stake.toFixed(2)}</>
                                )}
                            </button>

                            {error && (
                                <p className="text-[10px] text-red-500 text-center font-black uppercase tracking-widest animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
