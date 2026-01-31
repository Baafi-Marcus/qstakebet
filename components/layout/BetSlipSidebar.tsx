"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { BetSlipContext } from "@/lib/store/context"
import { X, Loader2 } from "lucide-react"
import { placeBet } from "@/lib/bet-actions"

export function BetSlipSidebar() {
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState("")
    const context = React.useContext(BetSlipContext)
    const selections = context?.selections || []
    const removeSelection = context?.removeSelection || (() => { })
    const clearSlip = context?.clearSlip || (() => { })
    const stake = context?.stake || 10
    const setStake = context?.setStake || (() => { })
    const isOpen = context?.isOpen || false
    const toggleSlip = context?.toggleSlip || (() => { })

    // Don't render anything if not open
    if (!isOpen) return null

    const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1)
    const potentialWin = stake * totalOdds

    return (
        <>
            {/* Mobile Overlay (Background) */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                onClick={toggleSlip}
            />

            {/* Desktop Overlay (Background) */}
            <div
                className="hidden lg:block fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                onClick={toggleSlip}
            />

            {/* Sidebar Content - Right Drawer on Desktop, Bottom Sheet on Mobile */}
            <div className={cn(
                "bg-card flex flex-col transition-all duration-300 ease-in-out z-[70]",
                // Mobile: Bottom sheet
                "fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl shadow-2xl border-t border-white/10",
                // Desktop: Horizontal Side Drawer
                "lg:fixed lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:w-96 lg:h-screen lg:rounded-none lg:border-l lg:border-border"
            )}>
                <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20 rounded-t-2xl lg:rounded-none">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSlip}
                            className="p-1 -ml-1 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <h3 className="font-semibold text-foreground">Bet Slip <span className="text-primary ml-1">({selections.length})</span></h3>
                    </div>

                    <button
                        onClick={clearSlip}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                        Clear All
                    </button>
                </div>

                {selections.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-8">
                        <p>Your bet slip is empty</p>
                        <button onClick={toggleSlip} className="mt-4 text-primary">Close</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selections.map((item) => (
                                <div key={item.selectionId} className="bg-secondary/30 rounded-lg p-3 relative group border border-transparent hover:border-slate-700">
                                    <button
                                        onClick={() => removeSelection(item.selectionId)}
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <div className="text-xs text-muted-foreground mb-1">{item.marketName}</div>
                                    <div className="text-sm font-medium text-foreground pr-4 line-clamp-1">{item.label}</div>
                                    <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.matchLabel}</div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-bold text-accent font-display">{item.odds.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-border bg-card space-y-4 pb-safe">
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground block">Stake (GHS)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={stake}
                                        onChange={(e) => setStake(Number(e.target.value))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Odds</span>
                                <span className="font-bold text-foreground">{totalOdds.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Potential Win</span>
                                <span className="font-bold text-accent text-lg">GHS {potentialWin.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={async () => {
                                    if (isProcessing) return
                                    setIsProcessing(true)
                                    setError("")
                                    try {
                                        const result = await placeBet(stake, selections)
                                        if (result.success) {
                                            clearSlip()
                                            toggleSlip()
                                            // Real-time balance refresh (handled by Next.js revalidatePath if added to action, or just standard router refresh)
                                            window.location.reload() // Quickest way to refresh all balances including Header
                                        } else {
                                            setError(result.error || "Failed to place bet")
                                        }
                                    } catch (err) {
                                        setError("A network error occurred")
                                    } finally {
                                        setIsProcessing(false)
                                    }
                                }}
                                disabled={isProcessing}
                                className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> PLACING...</> : "Place Bet"}
                            </button>

                            {error && (
                                <p className="text-xs text-red-500 text-center font-bold animate-pulse">
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
