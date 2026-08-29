"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { KeyIcon as KeyRound, PhoneIcon as Phone, LockClosedIcon as Lock, ExclamationCircleIcon as AlertCircle, ArrowLeftIcon as ArrowLeft, CheckCircleIcon as CheckCircle2 } from "@heroicons/react/24/solid";
import { resetPassword } from "@/lib/auth-actions"

export default function ForgotPasswordPage() {
    const [done, setDone] = useState(false)
    const [formData, setFormData] = useState({
        phone: "",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.phone || formData.phone.length < 10) {
            setError("Please enter a valid phone number")
            return
        }

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
                password: formData.password
            })

            if (result.success) {
                setDone(true)
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image src="/logo.svg" alt="QSTAKEbet Logo" width={48} height={48} className="animate-bounce-slow" />
                        <h1 className="text-4xl font-black text-foreground italic tracking-tighter">
                            QSTAKE<span className="text-foreground">bet</span>
                        </h1>
                    </div>
                    <p className="text-muted-foreground">Security & Account Recovery</p>
                </div>

                {/* Reset Card */}
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <KeyRound className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
                    </div>

                    {error && !done && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {!done ? (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Enter your registered phone number and choose a new password.
                            </p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard font-mono"
                                        placeholder="024XXXXXXX"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard"
                                        placeholder="New password (min. 6 characters)"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-standard hover:-translate-y-0.5 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Updating password..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    ) : (
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
                                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-standard hover:-translate-y-0.5"
                            >
                                Sign In Now
                            </Link>
                        </div>
                    )}

                    {/* Back to Login */}
                    {!done && (
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
