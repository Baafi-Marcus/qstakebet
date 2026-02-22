"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { KeyRound, Phone, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react"
import { resetPassword } from "@/lib/auth-actions"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<"phone" | "otp" | "reset" | "success">("phone")
    const [formData, setFormData] = useState({
        phone: "",
        otp: "",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [sendingOtp, setSendingOtp] = useState(false)

    const handleSendOtp = async () => {
        if (!formData.phone || formData.phone.length < 10) {
            setError("Please enter a valid phone number")
            return
        }

        setSendingOtp(true)
        setError("")

        try {
            const { generateAndSendOTP } = await import("@/lib/verification-actions")
            // Pass true for isExistingUser because this is a password reset
            const result = await generateAndSendOTP(formData.phone, true)

            if (result.success) {
                setStep("otp")
            } else {
                setError(result.error || "Failed to send SMS. Make sure the number is registered.")
            }
        } catch (e) {
            setError("Error sending OTP")
        } finally {
            setSendingOtp(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.otp || formData.otp.length !== 6) {
            setError("Please enter a valid 6-digit code")
            return
        }
        setStep("reset")
        setError("")
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            const result = await resetPassword({
                phone: formData.phone,
                otp: formData.otp,
                password: formData.password
            })

            if (result.success) {
                setStep("success")
            } else {
                setError(result.error || "Reset failed")
                setLoading(false)
            }
        } catch {
            setError("An error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 italic tracking-tighter">
                        QSTAKE<span className="text-purple-400">bet</span>
                    </h1>
                    <p className="text-slate-400">Security & Account Recovery</p>
                </div>

                {/* Reset Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <KeyRound className="h-6 w-6 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                    </div>

                    {error && (step !== "success") && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Input Phone */}
                    {step === "phone" && (
                        <div className="space-y-6">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Enter your registered phone number. We&apos;ll send you a 6-digit code to verify your identity.
                            </p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                                        placeholder="024XXXXXXX"
                                    />
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || !formData.phone}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingOtp ? "Sending code..." : "Send Verification Code"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <p className="text-slate-400 text-sm">
                                Enter the 6-digit code sent to <span className="text-white font-bold">{formData.phone}</span>
                            </p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-500 rounded">#</div>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all tracking-widest text-lg font-mono"
                                        placeholder="123456"
                                        maxLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                >
                                    Verify Code
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-400 mt-2 hover:underline underline-offset-4"
                                >
                                    Didn&apos;t receive it? Send again
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === "reset" && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            autoFocus
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/25"
                                >
                                    {loading ? "Updating password..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === "success" && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="p-4 bg-emerald-500/10 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful</h3>
                                <p className="text-slate-400 text-sm">You can now use your new password to log in to your account.</p>
                            </div>
                            <Link
                                href="/auth/login"
                                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                Sign In Now
                            </Link>
                        </div>
                    )}

                    {/* Back to Login */}
                    {step !== "success" && (
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-white transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
