"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { KeyIcon as KeyRound, PhoneIcon as Phone, LockClosedIcon as Lock, ExclamationCircleIcon as AlertCircle, ArrowLeftIcon as ArrowLeft, CheckCircleIcon as CheckCircle2 } from "@heroicons/react/24/solid";
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
    const [timer, setTimer] = useState(0)

    // Countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1)
            }, 1000)
        }
        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [timer])

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
                setTimer(600) // 10 minutes
            } else {
                setError(result.error || "Failed to send SMS. Make sure the number is registered.")
                // If it's a wait error, we could parse it but for now just showing it is fine
                if (result.error?.includes("wait")) {
                    // Optionally set timer based on error message if we parsed it properly
                }
            }
        } catch (e) {
            setError("Error sending OTP")
        } finally {
            setSendingOtp(false)
        }
    }

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
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
        <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/10 to-background flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image src="/logo.svg" alt="QSTAKEbet Logo" width={48} height={48} className="animate-bounce-slow" />
                        <h1 className="text-4xl font-black text-foreground italic tracking-tighter">
                            QSTAKE<span className="text-purple-400">bet</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground">Security & Account Recovery</p>
                </div>

                {/* Reset Card */}
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <KeyRound className="h-6 w-6 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
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
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Enter your registered phone number. We&apos;ll send you a 6-digit code to verify your identity.
                            </p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                                        placeholder="024XXXXXXX"
                                    />
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || !formData.phone || timer > 0}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingOtp ? "Sending code..." : timer > 0 ? `Resend in ${formatTimer(timer)}` : "Send Verification Code"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === "otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <p className="text-muted-foreground text-sm">
                                Enter the 6-digit code sent to <span className="text-foreground font-bold">{formData.phone}</span>
                            </p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground font-bold text-xs border border-muted-foreground rounded">#</div>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={formData.otp}
                                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all tracking-widest text-lg font-mono"
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
                                    disabled={sendingOtp || timer > 0}
                                    className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground/80 mt-2 hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
                                >
                                    {timer > 0 ? `Resend code in ${formatTimer(timer)}` : "Didn't receive it? Send again"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === "reset" && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            required
                                            autoFocus
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                                <h3 className="text-xl font-bold text-foreground mb-2">Password Reset Successful</h3>
                                <p className="text-muted-foreground text-sm">You can now use your new password to log in to your account.</p>
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
                        <div className="mt-8 pt-8 border-t border-border/50">
                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
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
