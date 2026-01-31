"use client"

import { useState } from "react"
import { Banknote, Phone, Smartphone, ChevronRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
// Note: We'll create the initiateWithdrawal action in lib/payment-actions.ts
// for now this is a placeholder to show the UI
import { initiateWithdrawal } from "@/lib/payment-actions"

const NETWORKS = [
    { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-400', textColor: 'text-black' },
    { id: 'telecel', name: 'Telecel Cash', color: 'bg-red-600', textColor: 'text-white' },
    { id: 'at', name: 'AT Money', color: 'bg-blue-600', textColor: 'text-white' },
]

export default function WithdrawPage() {
    const [amount, setAmount] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [network, setNetwork] = useState<'mtn' | 'telecel' | 'at'>('mtn')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!amount || parseFloat(amount) < 10) {
            setError("Min withdrawal is 10 GHS")
            return
        }

        if (!phoneNumber || phoneNumber.length < 10) {
            setError("Please enter a valid phone number")
            return
        }

        setLoading(true)

        try {
            const result = await initiateWithdrawal({
                amount: parseFloat(amount),
                phoneNumber,
                network
            })

            if (result.success) {
                setSuccess(true)
            } else {
                setError((result as any).error || "Failed to process withdrawal")
            }
        } catch (err) {
            setError("A network error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-purple-500" />
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-black">Withdrawal Requested!</h2>
                    <p className="text-slate-400 font-medium max-w-sm">
                        Your request for GHS {amount} is being processed. Funds will be sent to your {network.toUpperCase()} wallet shortly.
                    </p>
                </div>
                <div className="pt-6 w-full max-w-xs space-y-3">
                    <Link href="/account/wallet" className="block w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-100 transition-all">
                        VIEW WALLET
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-4">
                <Link href="/account/wallet" className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black mb-1">Withdraw Funds</h2>
                    <p className="text-slate-400 font-medium">Cash out your winnings instantly</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Network Selection */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Select Receipt Network</label>
                    <div className="grid grid-cols-3 gap-3">
                        {NETWORKS.map((net) => (
                            <button
                                key={net.id}
                                type="button"
                                onClick={() => setNetwork(net.id as any)}
                                className={cn(
                                    "relative p-4 rounded-2xl border-2 transition-all group overflow-hidden",
                                    network === net.id
                                        ? "border-purple-600 bg-purple-600/10 shadow-lg shadow-purple-500/10"
                                        : "border-white/5 bg-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-inner", net.color)}>
                                        <Smartphone className={cn("h-5 w-5", net.textColor)} />
                                    </div>
                                    <span className={cn("text-[10px] font-black uppercase tracking-tight", network === net.id ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>
                                        {net.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Enter Amount (GHS)</label>
                    <div className="relative group">
                        <Banknote className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Min 10.00"
                            className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-black text-white outline-none transition-all placeholder:text-slate-700"
                            required
                        />
                    </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Recipient MoMo Number</label>
                    <div className="relative group">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="024 XXX XXXX"
                            className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-black text-white outline-none transition-all placeholder:text-slate-700 font-mono"
                            required
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-6 w-6 animate-spin" />
                            PROCESSING...
                        </>
                    ) : (
                        <>
                            WITHDRAW GHS {amount || "0.00"}
                            <ChevronRight className="h-6 w-6" />
                        </>
                    )}
                </button>
            </form>

            {/* Fees Note */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Withdrawals are processed instantly. Please ensure your phone number and network selection are correct.
                    A standard network fee of 1% might apply.
                </p>
            </div>
        </div>
    )
}
