"use client"

import { useState, useEffect } from "react"
import { Wallet, Smartphone, ChevronRight, AlertCircle, Clock, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { createWithdrawalRequest, getUserWithdrawalRequests } from "@/lib/withdrawal-actions"
import { cn } from "@/lib/utils"
import { FINANCE_LIMITS } from "@/lib/constants"

const NETWORKS = [
    { id: 'mtn_momo', name: 'MTN MoMo', color: 'bg-yellow-400', textColor: 'text-black' },
    { id: 'telecel_cash', name: 'Telecel Cash', color: 'bg-red-600', textColor: 'text-white' },
    { id: 'at_money', name: 'AT Money', color: 'bg-blue-600', textColor: 'text-white' },
] as const

export default function WithdrawPage() {
    const [amount, setAmount] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [accountName, setAccountName] = useState("")
    const [network, setNetwork] = useState<typeof NETWORKS[number]['id']>('mtn_momo')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [requests, setRequests] = useState<any[]>([])

    useEffect(() => {
        loadRequests()
    }, [])

    const loadRequests = async () => {
        const data = await getUserWithdrawalRequests()
        setRequests(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!amount || parseFloat(amount) < FINANCE_LIMITS.WITHDRAWAL.MIN) {
            setError(`Min withdrawal is ${FINANCE_LIMITS.WITHDRAWAL.MIN} GHS`)
            return
        }

        setLoading(true)

        try {
            const result = await createWithdrawalRequest({
                amount: parseFloat(amount),
                paymentMethod: network,
                accountNumber: phoneNumber,
                accountName: accountName
            })

            if (result.success) {
                setSuccess(true)
                setAmount("")
                loadRequests()
            } else {
                setError(result.error || "Failed to submit request")
            }
        } catch {
            setError("A network error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/account/wallet" className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black mb-1">Withdraw Funds</h2>
                    <p className="text-slate-400 font-medium">Request a payout to your Mobile Money</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {success ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-[2.5rem] p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white">Request Submitted</h3>
                        <p className="text-slate-400 text-sm font-medium">Your request is being reviewed by our team.</p>
                    </div>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-green-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Make Another Request
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Amount Input */}
                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Withdrawal Amount (GHS)</label>
                        <div className="relative group">
                            <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-black text-white outline-none transition-all placeholder:text-slate-700"
                                required
                            />
                        </div>
                    </div>

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
                                    <div className="flex flex-col items-center gap-2 text-center">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-inner", net.color)}>
                                            <Smartphone className={cn("h-5 w-5", net.textColor)} />
                                        </div>
                                        <span className={cn("text-[8px] font-black uppercase tracking-tighter leading-none", network === net.id ? "text-white" : "text-slate-500")}>
                                            {net.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="024 XXX XXXX"
                                className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-2xl px-6 py-4 text-lg font-black text-white outline-none transition-all placeholder:text-slate-700"
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Account Name (Optional)</label>
                            <input
                                type="text"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                placeholder="James Doe"
                                className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-2xl px-6 py-4 text-lg font-black text-white outline-none transition-all placeholder:text-slate-700"
                            />
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold px-2 flex items-start gap-1.5 uppercase tracking-widest leading-relaxed">
                        <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500" />
                        Withdrawals are reviewed manually. Ensure details match your KYC/MoMo registration.
                    </p>

                    {/* Submit Button */}
                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                SUBMITTING...
                            </>
                        ) : (
                            <>
                                REQUEST WITHDRAWAL
                                <ChevronRight className="h-6 w-6" />
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Recent Requests Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Recent Requests</h3>
                </div>

                <div className="space-y-3">
                    {requests.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 border border-white/5 rounded-[2rem]">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No withdrawal history</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                        req.status === 'paid' ? "bg-green-500/20 text-green-500" :
                                            req.status === 'rejected' ? "bg-red-500/20 text-red-500" :
                                                "bg-amber-500/20 text-amber-500"
                                    )}>
                                        {req.status === 'paid' ? <CheckCircle2 className="h-6 w-6" /> :
                                            req.status === 'rejected' ? <XCircle className="h-6 w-6" /> :
                                                <Clock className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-white">GHS {req.amount.toFixed(2)}</span>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                                req.status === 'paid' ? "bg-green-500/20 text-green-500" :
                                                    req.status === 'rejected' ? "bg-red-500/20 text-red-500" :
                                                        "bg-amber-500/20 text-amber-500"
                                            )}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                                            {req.paymentMethod.replace('_', ' ').toUpperCase()} • {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
