"use client"

import { useState } from "react"
import { X, DollarSign, Loader2, AlertCircle } from "lucide-react"
import { adjustUserBalance } from "@/lib/admin-actions"

interface BalanceAdjustmentModalProps {
    userId: string
    userName: string
    currentBalance: number
    onClose: () => void
    onSuccess: () => void
}

export function BalanceAdjustmentModal({ userId, userName, currentBalance, onClose, onSuccess }: BalanceAdjustmentModalProps) {
    const [amount, setAmount] = useState("")
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [type, setType] = useState<"add" | "subtract">("add")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount greater than 0")
            return
        }

        if (!reason.trim()) {
            setError("Please provide a reason for the adjustment")
            return
        }

        setIsSubmitting(true)
        try {
            const finalAmount = type === "add" ? numAmount : -numAmount
            const result = await adjustUserBalance(userId, finalAmount, reason)

            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.error || "Failed to adjust balance")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Adjust Balance</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            User: {userName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button
                            type="button"
                            onClick={() => setType("add")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "add" ? "bg-green-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Credit (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("subtract")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === "subtract" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            Debit (-)
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Current Balance</label>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm font-mono text-white font-bold">
                                ₵ {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Adjustment Amount (₵)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reason for Adjustment</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Compensation for match cancellation, Manual correction..."
                                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xs font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${type === 'add' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            `${type === 'add' ? 'Add Funds' : 'Remove Funds'}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
