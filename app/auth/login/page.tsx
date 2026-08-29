"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRightEndOnRectangleIcon as LogIn, LockClosedIcon as Lock, ExclamationCircleIcon as AlertCircle, PhoneIcon as Phone } from "@heroicons/react/24/solid";

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        phone: "",
        password: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                phone: formData.phone,
                password: formData.password,
                redirect: false
            })

            if (result?.error) {
                setError(
                    result.error === "CredentialsSignin"
                        ? "Invalid phone number or password"
                        : `Sign-in failed (${result.error}). Please refresh the page and try again.`
                )
                setLoading(false)
                return
            }

            // Redirect to home page with a full refresh to ensure session is recognized
            window.location.href = "/"
        } catch (err) {
            console.error("Sign-in exception:", err)
            setError(
                "Connection hiccup while signing in. Refresh the page (Ctrl+Shift+R) and try again."
            )
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
                    <p className="text-muted-foreground">Welcome back! Sign in to continue</p>
                </div>

                {/* Login Card */}
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <LogIn className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard font-mono"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-foreground/80">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-xs font-semibold text-primary hover:opacity-80 transition-standard"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-standard hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card/50 text-muted-foreground">
                                Don&apos;t have an account?
                            </span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <Link
                        href="/auth/register"
                        className="block w-full text-center bg-foreground/5 hover:bg-foreground/10 border border-border text-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Create Account
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-sm mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    )
}
