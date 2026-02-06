"use client"

import { useState } from "react"
import { CreditCard, ChevronRight, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createDeposit } from "@/lib/payment-actions"
import { cn } from "@/lib/utils"
import { FINANCE_LIMITS } from "@/lib/constants"

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

export default function DepositPage() {
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString())
    }

    const handleAmountChange = (val: string) => {
        // Remove negative signs and any non-numeric/non-decimal characters
        const sanitized = val.replace(/[^0-9.]/g, '')
        setAmount(sanitized)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const numAmount = parseFloat(amount)
        if (!amount || numAmount < FINANCE_LIMITS.DEPOSIT.MIN) {
            setError(`Min deposit is ${FINANCE_LIMITS.DEPOSIT.MIN} GHS`)
            return
        }

        if (numAmount > FINANCE_LIMITS.DEPOSIT.MAX) {
            setError(`Max deposit is ${FINANCE_LIMITS.DEPOSIT.MAX} GHS`)
            return
        }

        setLoading(true)

        try {
            const result = await createDeposit({
                amount: numAmount
            })

            if (result.success && result.authorization_url) {
                // Redirect to Paystack
                window.location.href = result.authorization_url
            } else {
                setError(result.error || "Failed to initiate deposit")
            }
        } catch {
            setError("A network error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10">
            <style jsx global>{`
                /* Hide number input spinners */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            <div className="flex items-center gap-4">
                <Link href="/account/wallet" className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black mb-1">Deposit Funds</h2>
                    <p className="text-slate-400 font-medium">Add balance instantly via Paystack</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Amount Input */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Enter Amount (GHS)</label>
                    <div className="relative group">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="number"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-black text-white outline-none transition-all placeholder:text-slate-700"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {QUICK_AMOUNTS.map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handleQuickAmount(val)}
                                className="py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs font-black text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            >
                                +{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Note */}
                <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                    <p className="text-[10px] text-slate-400 font-bold px-2 flex items-center gap-2 uppercase tracking-widest leading-relaxed">
                        <Loader2 className="h-3 w-3 animate-spin text-purple-600 shrink-0" />
                        You will be redirected to Paystack to complete your payment using MoMo, Card or Bank Transfer.
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            REDIRECTING...
                        </>
                    ) : (
                        <>
                            DEPOSIT GHS {amount || "0.00"}
                            <ChevronRight className="h-6 w-6" />
                        </>
                    )}
                </button>
            </form>

            {/* Help Note */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
                <div className="flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        By proceeding, you will be redirected to our secure payment partner, Paystack.
                        Funds are usually credited instantly upon successful payment.
                        If you encounter any issues, please contact support with your transaction reference.
                    </p>
                </div>
            </div>
        </div>
    )
}
