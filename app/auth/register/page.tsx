"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { UserPlusIcon as UserPlus, EnvelopeIcon as Mail, LockClosedIcon as Lock, UserIcon as User, PhoneIcon as Phone, ExclamationCircleIcon as AlertCircle, GiftIcon as Gift, AcademicCapIcon as GraduationCap, AtSymbolIcon as AtSymbol } from "@heroicons/react/24/solid";
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
        username: "",
        phone: "",
        almaMater: "",
        referredBy: refCode || ""
    })
    const [error, setError] = useState("")
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [loading, setLoading] = useState(false)
    const [createdUser, setCreatedUser] = useState<{ id: string, referralCode: string } | null>(null)

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

        setLoading(true)

        try {
            const result = await registerUser({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                username: formData.username || undefined,
                phone: formData.phone,
                almaMater: formData.almaMater || undefined,
                referredBy: formData.referredBy || undefined
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
                    <p className="text-muted-foreground">Create your account and play NSMQ Fantasy</p>
                </div>

                {/* Register Card */}
                <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
                    </div>

                    {/* Fantasy Banner */}
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                        <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-primary">Play NSMQ Fantasy!</p>
                            <p className="text-xs text-muted-foreground mt-1">Draft your school squad, earn points every matchday and climb the leaderboard.</p>
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
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Username <span className="text-muted-foreground text-xs ml-1">(shown on leaderboards & chat)</span>
                            </label>
                            <div className="relative">
                                <AtSymbol className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="e.g. nsmq_king"
                                    minLength={3}
                                    maxLength={20}
                                    pattern="[A-Za-z0-9_]+"
                                    title="3-20 characters: letters, numbers and underscores only"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Alma Mater Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Alma Mater (School) <span className="text-muted-foreground text-xs ml-1">(Optional)</span>
                            </label>
                            <div className="relative">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="e.g. Prempeh College"
                                    value={formData.almaMater}
                                    onChange={(e) => setFormData({ ...formData, almaMater: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

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
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard verified-inputs"
                                />
                            </div>
                        </div>

                        {/* Referral Code Field (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Referral Code <span className="text-muted-foreground">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.referredBy}
                                    onChange={(e) => setFormData({ ...formData, referredBy: e.target.value.toUpperCase() })}
                                    className="w-full bg-background/40 border border-input rounded-xl pl-12 pr-4 py-3 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-standard uppercase verified-inputs"
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
                                className="mt-1 h-4 w-4 rounded border-input bg-background/40 text-primary focus:ring-primary/20 focus:ring-offset-0 transition-standard cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer select-none">
                                I agree to the <Link href="/terms" className="text-primary hover:opacity-80 font-bold underline underline-offset-4">Terms & Conditions</Link> and <Link href="/privacy" className="text-primary hover:opacity-80 font-bold underline underline-offset-4">Privacy Policy</Link>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !agreedToTerms}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-standard hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-4"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-card/50 text-muted-foreground">
                                Already have an account?
                            </span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <Link
                        href="/auth/login"
                        className="block w-full text-center bg-foreground/5 hover:bg-foreground/10 border border-border text-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-muted-foreground text-sm mt-6">
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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    )
}
