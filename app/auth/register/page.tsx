"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, Gift } from "lucide-react"
import { registerUser } from "@/lib/auth-actions"
import { ReferralSharePopup } from "@/components/ui/ReferralSharePopup"

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const refCode = searchParams.get("ref")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
        referredBy: refCode || ""
    })
    const [otp, setOtp] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [error, setError] = useState("")
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [loading, setLoading] = useState(false)
    const [createdUser, setCreatedUser] = useState<{ id: string, referralCode: string } | null>(null)
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
            if (interval) clearInterval(interval)
        }
    }, [timer])

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
    }

    // Send OTP Handler
    const handleSendOtp = async () => {
        if (!formData.phone || formData.phone.length < 10) {
            setError("Please enter a valid phone number first")
            return
        }

        setSendingOtp(true)
        setError("")

        try {
            const { generateAndSendOTP } = await import("@/lib/verification-actions")
            const result = await generateAndSendOTP(formData.phone)

            if (result.success) {
                setOtpSent(true)
                setTimer(600) // 10 minutes
            } else {
                setError(result.error || "Failed to send SMS")
            }
        } catch (e) {
            setError("Error sending OTP")
        } finally {
            setSendingOtp(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        // Validation
        if (!agreedToTerms) {
            setError("You must agree to the Terms & Conditions to create an account")
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (!formData.phone) {
            setError("Phone number is required")
            return
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        if (!otp) {
            setError("Please verify your phone number with the OTP code")
            return
        }

        setLoading(true)

        try {
            const result = await registerUser({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                referredBy: formData.referredBy || undefined,
                otp // Pass OTP for server-side verification
            })

            if (result.success) {
                // Instead of immediate redirect, show the share popup
                const user = (result as any).user;
                setCreatedUser({
                    id: user?.id as string,
                    referralCode: user?.referralCode as string
                })
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
                    <p className="text-slate-400">Create your account and start betting</p>
                </div>

                {/* Register Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <UserPlus className="h-6 w-6 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create Account</h2>
                    </div>

                    {/* Welcome Bonus Banner */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
                        <Gift className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-purple-300">Welcome Bonus!</p>
                            <p className="text-xs text-slate-400 mt-1">Get 10 GHS free bet when you sign up</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all verified-inputs"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all verified-inputs"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Phone Field (Required) & OTP */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Phone Number
                            </label>
                            <div className="relative flex gap-2">
                                <div className="relative w-full">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all verified-inputs"
                                        placeholder="024XXXXXXX"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp || (otpSent && timer > 0) || !formData.phone}
                                    className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 text-purple-400 text-sm font-semibold rounded-xl transition-all whitespace-nowrap disabled:opacity-50"
                                >
                                    {sendingOtp ? "Sending..." : (otpSent && timer > 0) ? formatTimer(timer) : "Send Code"}
                                </button>
                            </div>
                        </div>

                        {/* OTP Field (Visible after sending) */}
                        {otpSent && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Enter Verification Code
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-500 rounded">#</div>
                                    <input
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all tracking-widest text-lg verified-inputs"
                                        placeholder="123456"
                                        maxLength={6}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Enter the 6-digit code sent to your phone.
                                </p>
                            </div>
                        )}

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all verified-inputs"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all verified-inputs"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Referral Code Field (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Referral Code <span className="text-slate-500">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={formData.referredBy}
                                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all uppercase verified-inputs"
                                    placeholder="ABC123XYZ"
                                />
                            </div>
                        </div>

                        {/* T&C Agreement */}
                        <div className="flex items-start gap-3 mt-6">
                            <input
                                type="checkbox"
                                id="terms"
                                required
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-white/10 bg-black/40 text-purple-600 focus:ring-purple-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-sm text-slate-400 leading-tight cursor-pointer select-none">
                                I agree to the <Link href="/terms" className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4">Terms & Conditions</Link> and <Link href="/privacy" className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4">Privacy Policy</Link>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreedToTerms}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 mt-4"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900/50 text-slate-400">
                                Already have an account?
                            </span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <Link
                        href="/auth/login"
                        className="block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
            {/* Referral Share Popup */}
            {createdUser && (
                <ReferralSharePopup
                    referralCode={createdUser.referralCode}
                    isOpen={!!createdUser}
                    onClose={() => {
                        router.push("/")
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    )
}
