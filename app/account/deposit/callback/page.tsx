"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { confirmDeposit } from "@/lib/payment-actions"

export default function PaystackCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [error, setError] = useState("")
    const [amount, setAmount] = useState<number | null>(null)
    const confirmedRef = useRef(false)

    useEffect(() => {
        const reference = searchParams.get("reference")
        const trxref = searchParams.get("trxref")
        const finalRef = reference || trxref

        if (!finalRef) {
            // Use a tiny timeout or just let verify handle it
            setTimeout(() => {
                setStatus('error')
                setError("No transaction reference found")
            }, 0)
            return
        }

        if (confirmedRef.current) return
        confirmedRef.current = true

        const verify = async () => {
            try {
                const result = await confirmDeposit(finalRef)
                if (result.success) {
                    setStatus('success')
                    setAmount(result.amount || null)

                    // Auto redirect after 5 seconds
                    setTimeout(() => {
                        router.push("/account/wallet")
                    }, 5000)
                } else {
                    setStatus('error')
                    setError(result.error || "Verification failed")
                }
            } catch (err) {
                setStatus('error')
                setError("An unexpected error occurred during verification")
            }
        }

        verify()
    }, [searchParams, router])

    if (status === 'loading') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
                    <Loader2 className="h-16 w-16 text-purple-600 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white">Verifying Transaction</h2>
                    <p className="text-slate-400 font-medium">Please do not close this window...</p>
                </div>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
                    <div className="h-24 w-24 bg-emerald-500/20 border-4 border-emerald-500/30 rounded-full flex items-center justify-center relative z-10">
                        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-white">Payment Successful!</h2>
                    <p className="text-xl text-slate-400 font-medium">
                        {amount ? `GHS ${amount.toFixed(2)} has been added to your wallet.` : "Your wallet has been credited."}
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <Link
                        href="/account/wallet"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        View Wallet
                        <ArrowRight className="h-5 w-5" />
                    </Link>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Redirecting in a few seconds...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150" />
                <div className="h-24 w-24 bg-red-500/20 border-4 border-red-500/30 rounded-full flex items-center justify-center relative z-10">
                    <XCircle className="h-12 w-12 text-red-400" />
                </div>
            </div>

            <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-white">Payment Verification Failed</h2>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold max-w-md mx-auto">
                    {error}
                </div>
                <p className="text-slate-400 font-medium max-w-md mx-auto">
                    If funds were deducted from your account, please contact our support team with your transaction reference.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <Link
                    href="/account/deposit"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    Try Again
                </Link>
                <Link
                    href="/account/wallet"
                    className="text-slate-500 hover:text-white text-sm font-black uppercase tracking-widest transition-colors"
                >
                    Back to Wallet
                </Link>
            </div>
        </div>
    )
}
