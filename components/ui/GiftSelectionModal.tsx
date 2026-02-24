"use client"

import React from "react"
import { Gift, X, Zap } from "lucide-react"
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
                // Ensure amount is still valid for current stake
                setSelectedAmount(Math.min(gift.amount, totalStake))
            } else {
                setSelectedAmount(0)
            }
        }
    }, [isOpen, initialBonusId, gifts, totalStake])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#1a1c23] w-full max-w-[340px] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-600/20 rounded-2xl">
                            <Gift className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Select Gift</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Balance</p>
                        </div>
                        <button onClick={onClose} className="ml-auto p-2 text-slate-500 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {gifts.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No gifts available</p>
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
                                            selectedGiftId === gift.id ? "bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/20" : "bg-slate-900 border-white/5 hover:border-purple-500/50",
                                            isIneligible && "opacity-50 grayscale"
                                        )}
                                        onClick={() => {
                                            if (isIneligible) return
                                            setSelectedGiftId(gift.id)
                                            setSelectedAmount(Math.min(gift.amount, totalStake))
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={cn("block text-[10px] font-black uppercase tracking-tighter mb-0.5", selectedGiftId === gift.id ? "text-purple-200" : "text-slate-500")}>
                                                    {gift.type}
                                                    {isOddsIneligible && " • Min Odds " + gift.minOdds.toFixed(2)}
                                                    {isSelectionIneligible && " • Min " + gift.minSelections + " Selections"}
                                                </span>
                                                <span className={cn("text-lg font-black", selectedGiftId === gift.id ? "text-white" : "text-slate-200")}>GHS {gift.amount.toFixed(2)}</span>
                                            </div>
                                            {selectedGiftId === gift.id && (
                                                <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center">
                                                    <div className="h-2.5 w-2.5 bg-purple-600 rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {selectedGiftId && (
                        <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Use Amount</span>
                                <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2 border border-white/5">
                                    <span className="text-xs font-bold text-slate-600">GHS</span>
                                    <input
                                        type="number"
                                        value={selectedAmount}
                                        onChange={(e) => {
                                            const gift = gifts.find(g => g.id === selectedGiftId)
                                            if (gift) {
                                                const val = Math.max(0, Math.min(gift.amount, totalStake, Number(e.target.value)))
                                                setSelectedAmount(val)
                                            }
                                        }}
                                        className="w-20 bg-transparent text-right font-black text-sm text-white focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        const gift = gifts.find(g => g.id === selectedGiftId)
                                        if (gift) {
                                            setSelectedAmount(Math.min(gift.amount, totalStake))
                                        }
                                    }}
                                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg transition-all"
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

                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <button
                            onClick={() => {
                                setSelectedGiftId(undefined)
                                setSelectedAmount(0)
                                onApply(undefined, 0)
                                onClose()
                            }}
                            className="py-4 bg-slate-900 hover:bg-slate-800 text-slate-500 font-black text-[10px] uppercase rounded-2xl transition-all"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => {
                                onApply(selectedGiftId, selectedAmount)
                                onClose()
                            }}
                            className="py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase rounded-2xl transition-all shadow-lg shadow-purple-500/20"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
