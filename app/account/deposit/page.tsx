"use client"

import { useState } from "react"
import { CreditCard, Phone, Smartphone, ChevronRight, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createDeposit } from "@/lib/payment-actions"
import { cn } from "@/lib/utils"

const NETWORKS = [
    { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-400', textColor: 'text-black' },
    { id: 'telecel', name: 'Telecel Cash', color: 'bg-red-600', textColor: 'text-white' },
    { id: 'at', name: 'AT Money', color: 'bg-blue-600', textColor: 'text-white' },
] as const

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

export default function DepositPage() {
    const [amount, setAmount] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [network, setNetwork] = useState<'mtn' | 'telecel' | 'at'>('mtn')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!amount || parseFloat(amount) < 1) {
            setError("Min deposit is 1 GHS")
            return
        }

        if (!phoneNumber || phoneNumber.length < 10) {
            setError("Please enter a valid phone number")
            return
        }

        setLoading(true)

        try {
            const result = await createDeposit({
                amount: parseFloat(amount),
                phoneNumber,
                network
            })

            if (result.success) {
                setSuccess(true)
            } else {
                setError(result.error || "Failed to initiate deposit")
            }
        } catch {
            setError("A network error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-black">Request Sent!</h2>
                    <p className="text-slate-400 font-medium max-w-sm">
                        Please check your phone for the Mobile Money prompt and enter your PIN to authorize the transaction.
                    </p>
                </div>
                <div className="pt-6 w-full max-w-xs space-y-3">
                    <Link href="/account/wallet" className="block w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-slate-100 transition-all">
                        VIEW WALLET
                    </Link>
                    <button onClick={() => setSuccess(false)} className="block w-full text-slate-400 hover:text-white font-bold py-2 transition-all">
                        Make Another Deposit
                    </button>
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
                    <h2 className="text-3xl font-black mb-1">Deposit Funds</h2>
                    <p className="text-slate-400 font-medium">Add balance instantly via Mobile Money</p>
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
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Select Network</label>
                    <div className="grid grid-cols-3 gap-3">
                        {NETWORKS.map((net) => (
                            <button
                                key={net.id}
                                type="button"
                                onClick={() => setNetwork(net.id)}
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
                                {network === net.id && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Enter Amount (GHS)</label>
                    <div className="relative group">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
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

                {/* Phone Number Input */}
                <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">MoMo Phone Number</label>
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
                    <p className="text-[10px] text-slate-500 font-bold px-2 flex items-center gap-1.5 uppercase tracking-widest">
                        <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                        Secured Instant Payment via Moolre
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
                            PROCESSING...
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
            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        By proceeding, you authorize a collection request to your mobile wallet.
                        Ensure you have sufficient balance and your phone is unlocked to receive the authorization prompt.
                    </p>
                </div>

                {/* Fallback Section */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment not working?</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* POS Link Option */}
                        <a
                            href="https://pos.moolre.com/2XFW8edMznHOZpltJCfD5aNwB9RGmv"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl group hover:bg-amber-500/20 transition-all"
                        >
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Option 1: POS LINK</p>
                                <p className="text-sm font-bold text-white">Direct Payment Portal</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                <ChevronRight className="h-5 w-5" />
                            </div>
                        </a>

                        {/* USSD Option */}
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-center gap-1">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Option 2: MERCHANT CODE (USSD)</p>
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-black text-white tracking-widest">*203*0762616#</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText("*203*0762616#")
                                        // Optional: add a toast notification here
                                    }}
                                    className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors"
                                >
                                    COPY CODE
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest pt-2">
                        Mention your QSTAKE username in the payment note if using fallback options
                    </p>
                </div>
            </div>
        </div>
    )
}
