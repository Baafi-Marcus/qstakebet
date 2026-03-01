'use client'

import React, { useState } from 'react'
import { VirtualSelection } from '@/lib/virtuals'
import { ShieldAlert, Trash2, Zap, Ticket } from 'lucide-react'
import { checkQDartsCorrelation } from '@/lib/q-darts-odds'

interface QDartsBetSlipProps {
    selections: VirtualSelection[]
    onClear: () => void
    onRemove: (id: string) => void
    onPlaceBet: (stake: number, totalOdds: number, potentialPayout: number) => Promise<void>
    isLocked: boolean
    balance: number
    bonusBalance: number
    balanceType: 'cash' | 'gift'
}

export function QDartsBetSlip({
    selections,
    onClear,
    onRemove,
    onPlaceBet,
    isLocked,
    balance,
    bonusBalance,
    balanceType
}: QDartsBetSlipProps) {
    const [stake, setStake] = useState<string>('1.00')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // In Q-DARTS, multiple selections are strictly an Accumulator.
    // Total odds is the product of all individual odds.
    const totalOdds = selections.reduce((acc, sel) => acc * sel.odds, 1)

    // Safety correlation check
    const hasConflicts = checkQDartsCorrelation(selections)

    const numStake = Math.max(0, parseFloat(stake) || 0)
    const potentialPayout = numStake * totalOdds

    const handlePlaceBet = async () => {
        if (numStake <= 0) return alert('Enter a valid stake')

        if (balanceType === 'cash' && numStake > balance) {
            return alert('Insufficient cash balance')
        }

        if (balanceType === 'gift' && numStake > bonusBalance) {
            return alert('Insufficient gift balance')
        }

        setIsSubmitting(true)
        await onPlaceBet(numStake, totalOdds, potentialPayout)
        setIsSubmitting(false)
    }

    if (selections.length === 0) return null

    return (
        <div className="w-full bg-slate-900 border-l border-white/5 flex flex-col h-full shadow-2xl relative z-40">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-emerald-400" />
                    <span className="font-black uppercase tracking-widest text-sm text-white">
                        {selections.length === 1 ? 'Single Bet' : `Accumulator (${selections.length})`}
                    </span>
                </div>
                <button
                    onClick={onClear}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Selections List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {hasConflicts && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2 text-[9px] font-black uppercase text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                        <span>Correlated selections blocked.</span>
                    </div>
                )}

                {selections.map(s => (
                    <div key={s.selectionId} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex justify-between items-center group relative overflow-hidden transition-colors hover:bg-slate-900">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-600/50" />
                        <div className="flex flex-col pl-1.5">
                            <span className="text-[8px] text-slate-500 uppercase font-black tracking-tight">{s.marketName}</span>
                            <span className="text-xs font-bold text-white leading-tight">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-emerald-400">{s.odds.toFixed(2)}</span>
                            <button
                                onClick={() => onRemove(s.selectionId)}
                                className="text-slate-700 hover:text-red-400 transition-colors p-1"
                            >
                                <svg width="8" height="8" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Summary & Action */}
            <div className="p-4 bg-slate-950 border-t border-white/5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Odds</span>
                    <span className="text-xl font-mono font-black text-emerald-400">{totalOdds.toFixed(2)}</span>
                </div>

                {/* Stake Input */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">GHS</span>
                    <input
                        type="number"
                        value={stake}
                        onChange={e => setStake(e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-14 pr-4 text-white font-mono font-black text-lg focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-700"
                        placeholder="0.00"
                    />
                    {balanceType === 'gift' && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-purple-400 bg-purple-950/50 px-2 py-1 rounded-lg">
                            <Zap className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase">Gift Active</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potential Win</span>
                    <span className="text-lg font-mono font-black text-white">{potentialPayout.toFixed(2)}</span>
                </div>

                <button
                    disabled={hasConflicts || isLocked || isSubmitting || numStake <= 0}
                    onClick={handlePlaceBet}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all relative overflow-hidden ${hasConflicts || isLocked || numStake <= 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        }`}
                >
                    {isSubmitting ? 'Processing...' : isLocked ? 'Betting Locked' : 'Place Bet'}

                    {/* Animated shine effect if active */}
                    {!(hasConflicts || isLocked || numStake <= 0 || isSubmitting) && (
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine" />
                    )}
                </button>
            </div>
        </div>
    )
}
