"use client"

import React, { useState } from "react"
import { CreditCard, ChevronRight, Loader2, X } from "lucide-react"
import { createDeposit } from "@/lib/payment-actions"
import { cn } from "@/lib/utils"
import { FINANCE_LIMITS } from "@/lib/constants"

interface QuickDepositProps {
    isOpen: boolean;
    onClose: () => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

export function QuickDeposit({ isOpen, onClose }: QuickDepositProps) {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    if (!isOpen) return null

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const numAmount = parseFloat(amount)
        if (!amount || numAmount < FINANCE_LIMITS.DEPOSIT.MIN) {
            setError(`Min: ${FINANCE_LIMITS.DEPOSIT.MIN} GHS`)
            return
        }

        setLoading(true)

        try {
            const result = await createDeposit({ amount: numAmount })
            if (result.success && result.authorization_url) {
                window.location.href = result.authorization_url
            } else {
                setError(result.error || "Failed to initiate")
            }
        } catch {
            setError("Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full sm:max-w-md bg-slate-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 shadow-2xl flex flex-col p-8 pb-12 sm:pb-8 animate-in slide-in-from-bottom-full duration-500">
                {/* Drag Handle (Mobile) */}
                <div className="flex justify-center -mt-4 mb-6 sm:hidden">
                    <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white">Quick Deposit</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Instant Paystack Funding</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <div className="relative group">
                            <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-2xl pl-16 pr-8 py-6 text-3xl font-black text-white outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {QUICK_AMOUNTS.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleQuickAmount(val)}
                                    className={cn(
                                        "py-3 rounded-xl border transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest",
                                        amount === val.toString()
                                            ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20"
                                            : "bg-white/5 border-white/5 text-slate-500 hover:text-white"
                                    )}
                                >
                                    +{val}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-16 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:text-slate-500 text-white font-black rounded-2xl text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Deposit GHS {amount || "0.00"}
                                <ChevronRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
