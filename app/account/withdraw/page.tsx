"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Wallet, Smartphone, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { requestWithdrawal } from "@/lib/withdrawal-actions"
import { detectPaymentMethod, getProviderName } from "@/lib/phone-utils"
import { getUserProfileSummary } from "@/lib/user-actions"

const MIN_WITHDRAWAL = 1;
const MAX_WITHDRAWAL = 1000;

export default function WithdrawPage() {
    const { data: session } = useSession()
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [showOTP, setShowOTP] = useState(false)
    const [otp, setOtp] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [detectedProvider, setDetectedProvider] = useState<string>("")
    const [isVerified, setIsVerified] = useState(true) // Initial assume verified, check on load

    useEffect(() => {
        // Initial verification check
        async function checkVerification() {
            try {
                const response = await getUserProfileSummary();
                if (response.success && response.user) {
                    setIsVerified(!!(response.user as any).phoneVerified);
                }
            } catch (err) {
                console.error("Failed to check verification status", err);
            }
        }
        checkVerification();
    }, []);

    useEffect(() => {
        if (session?.user?.phone) {
            const method = detectPaymentMethod(session.user.phone);
            if (method) {
                setDetectedProvider(getProviderName(method));
            }
        }
    }, [session])

    const handleSendOTP = async () => {
        setVerifying(true)
        setError("")
        const { sendVerificationOTP } = await import("@/lib/verification-actions")
        try {
            const res = await sendVerificationOTP()
            if (res.success) {
                setOtpSent(true)
                setShowOTP(true)
            } else {
                setError(res.error || "Failed to send OTP")
            }
        } catch (err) {
            setError("Failed to trigger verification")
        } finally {
            setVerifying(false)
        }
    }

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setVerifying(true)
        setError("")
        const { verifyAndMarkUser } = await import("@/lib/verification-actions")
        try {
            const res = await verifyAndMarkUser(otp)
            if (res.success) {
                setIsVerified(true)
                setShowOTP(false)
                setSuccess(false) // Reset success state if any
            } else {
                setError(res.error || "Invalid OTP")
            }
        } catch (err) {
            setError("Verification failed")
        } finally {
            setVerifying(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!isVerified) {
            setError("Your phone number is not verified. Please verify it first.")
            setShowOTP(true)
            setLoading(false)
            return
        }

        const amountNum = parseFloat(amount);

        if (!amountNum || amountNum < MIN_WITHDRAWAL) {
            setError(`Minimum withdrawal is ${MIN_WITHDRAWAL} GHS`)
            setLoading(false)
            return
        }

        if (amountNum > MAX_WITHDRAWAL) {
            setError(`Maximum withdrawal is ${MAX_WITHDRAWAL} GHS`)
            setLoading(false)
            return
        }

        try {
            const result = await requestWithdrawal(amountNum)

            if (result.success) {
                setSuccess(true)
                setAmount("")
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
                    <p className="text-slate-400 font-medium">Instant payout to your Mobile Money</p>
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
                        <h3 className="text-xl font-black text-white">Withdrawal Processing</h3>
                        <p className="text-slate-400 text-sm font-medium">Money will be sent to your MoMo account shortly.</p>
                    </div>
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-green-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Make Another Request
                    </button>
                </div>
            ) : showOTP ? (
                <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="h-8 w-8 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-black text-white">Phone Verification Required</h3>
                        <p className="text-slate-400 text-sm font-medium">Enter the 6-digit code sent to {session?.user?.phone}</p>
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] px-8 py-6 text-4xl font-black text-white text-center tracking-[1em] outline-none transition-all placeholder:text-slate-700"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <button
                            disabled={verifying || otp.length < 6}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    VERIFYING...
                                </>
                            ) : (
                                <>
                                    VERIFY & CONTINUE
                                    <ChevronRight className="h-6 w-6" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={verifying}
                            className="w-full text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
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
                                step="0.01"
                                min={MIN_WITHDRAWAL}
                                max={MAX_WITHDRAWAL}
                                className="w-full bg-white/5 border-2 border-white/5 focus:border-purple-600 rounded-[2rem] pl-16 pr-8 py-6 text-2xl font-black text-white outline-none transition-all placeholder:text-slate-700"
                                required
                            />
                        </div>
                    </div>

                    {/* Auto-Detected Provider Info */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-purple-400" />
                            <span className="text-sm font-black uppercase tracking-widest text-purple-300">Withdrawal Details</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Provider</p>
                                <p className="text-white font-black mt-1">{detectedProvider || "Detecting..."}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Account</p>
                                <p className="text-white font-black mt-1">{session?.user?.phone || "N/A"}</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-purple-400/80 font-bold uppercase tracking-widest">
                            {isVerified ? "✓ Using your verified phone number" : "✗ Phone number not verified"}
                        </p>

                        {!isVerified && !showOTP && (
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={verifying}
                                className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-widest transition-all"
                            >
                                {verifying ? "SENDING OTP..." : "VERIFY NOW TO WITHDRAW"}
                            </button>
                        )}
                    </div>

                    <p className="text-[10px] text-slate-500 font-bold px-2 flex items-start gap-1.5 uppercase tracking-widest leading-relaxed">
                        <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500" />
                        Withdrawals are processed automatically via Paystack. Min: {MIN_WITHDRAWAL} GHS, Max: {MAX_WITHDRAWAL} GHS
                    </p>

                    {/* Submit Button */}
                    <button
                        disabled={loading || !isVerified}
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black py-6 rounded-[2rem] text-xl shadow-2xl shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                PROCESSING...
                            </>
                        ) : !isVerified ? (
                            <>
                                VERIFICATION REQUIRED
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
        </div>
    )
}
