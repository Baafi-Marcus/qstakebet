"use client"

import React from "react"
import { GiftIcon as Gift, XMarkIcon as X, BoltIcon as Zap } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"

interface GiftSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    gifts: any[]
    bonusId?: string
    onApply: (giftId: string | undefined, amount: number) => void
    totalOdds: number
    selectionsCount: number
    totalStake: number
}

export function GiftSelectionModal({
    isOpen,
    onClose,
    gifts,
    bonusId: initialBonusId,
    onApply,
    totalOdds,
    selectionsCount,
    totalStake
}: GiftSelectionModalProps) {
    const [selectedGiftId, setSelectedGiftId] = React.useState<string | undefined>(initialBonusId)
    const [selectedAmount, setSelectedAmount] = React.useState<number>(0)

    // Reset local state when opened or initialBonusId changes
    React.useEffect(() => {
        if (isOpen) {
            setSelectedGiftId(initialBonusId)
            const gift = gifts.find(g => g.id === initialBonusId)
            if (gift) {
                // Ensure amount is still valid
                setSelectedAmount(gift.amount)
            } else {
                setSelectedAmount(0)
            }
        }
    }, [isOpen, initialBonusId, gifts, totalStake])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 pb-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-popover w-full max-w-[340px] rounded-t-[2.5rem] sm:rounded-[2rem] border border-border/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
                <div className="p-4 pt-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/20 rounded-xl">
                            <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Select Gift</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Available Balance</p>
                        </div>
                        <button onClick={onClose} className="ml-auto p-2 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {gifts.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No gifts available</p>
                            </div>
                        ) : (
                            gifts.map((gift) => {
                                const isOddsIneligible = gift.minOdds && totalOdds < gift.minOdds
                                const isSelectionIneligible = gift.minSelections && selectionsCount < gift.minSelections
                                const isIneligible = isOddsIneligible || isSelectionIneligible

                                return (
                                    <div
                                        key={gift.id}
                                        className={cn(
                                            "p-4 rounded-2xl border transition-all cursor-pointer group",
                                            selectedGiftId === gift.id ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-card border-border/50 hover:border-primary/50",
                                            isIneligible && "opacity-50 grayscale"
                                        )}
                                        onClick={() => {
                                            if (isIneligible) return
                                            setSelectedGiftId(gift.id)
                                            setSelectedAmount(gift.amount)
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={cn("block text-[10px] font-black uppercase tracking-tighter mb-0.5", selectedGiftId === gift.id ? "text-primary-foreground/90" : "text-muted-foreground")}>
                                                    {gift.type}
                                                    {isOddsIneligible && " • Min Odds " + gift.minOdds.toFixed(2)}
                                                    {isSelectionIneligible && " • Min " + gift.minSelections + " Selections"}
                                                </span>
                                                <span className={cn("text-lg font-black", selectedGiftId === gift.id ? "text-white" : "text-foreground/90")}>GHS {gift.amount.toFixed(2)}</span>
                                            </div>
                                            {selectedGiftId === gift.id && (
                                                <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
                                                    <div className="h-2.5 w-2.5 bg-primary rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {selectedGiftId && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">Use Amount</span>
                                <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-border/50">
                                    <span className="text-xs font-bold text-muted-foreground/70">GHS</span>
                                    <input
                                        type="number"
                                        value={selectedAmount}
                                        onChange={(e) => {
                                            const gift = gifts.find(g => g.id === selectedGiftId)
                                            if (gift) {
                                                const val = Math.max(0, Math.min(gift.amount, Number(e.target.value)))
                                                setSelectedAmount(val)
                                            }
                                        }}
                                        className="w-20 bg-transparent text-right font-black text-sm text-foreground focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        const gift = gifts.find(g => g.id === selectedGiftId)
                                        if (gift) {
                                            setSelectedAmount(gift.amount)
                                        }
                                    }}
                                    className="flex-1 py-1.5 bg-muted hover:bg-muted/70 text-muted-foreground text-[10px] font-black uppercase rounded-lg transition-all"
                                >
                                    Use Max
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedAmount(0)
                                        setSelectedGiftId(undefined)
                                    }}
                                    className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-lg transition-all"
                                >
                                    Deselect
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <button
                            onClick={() => {
                                setSelectedGiftId(undefined)
                                setSelectedAmount(0)
                                onApply(undefined, 0)
                                onClose()
                            }}
                            className="py-4 bg-card hover:bg-muted text-muted-foreground font-black text-[10px] uppercase rounded-2xl transition-all"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => {
                                onApply(selectedGiftId, selectedAmount)
                                onClose()
                            }}
                            className="py-4 bg-primary hover:bg-primary text-white font-black text-[10px] uppercase rounded-2xl transition-all shadow-lg shadow-primary/20"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
