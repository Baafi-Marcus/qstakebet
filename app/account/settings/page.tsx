"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PhoneIcon as Phone, ShieldCheckIcon as Shield, CheckCircleIcon as CheckCircle2, ExclamationCircleIcon as AlertCircle, ArrowPathIcon as Loader2, PencilSquareIcon as Edit2, ArrowLeftIcon as ArrowLeft, AtSymbolIcon as AtSymbol } from "@heroicons/react/24/solid";
import Link from "next/link"
import { requestPhoneUpdate, confirmPhoneUpdate } from "@/lib/phone-update-actions"
import { getProviderName, detectPaymentMethod } from "@/lib/phone-utils"
import { updateUsername, getUserProfileSummary } from "@/lib/user-actions"

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const [showPhoneUpdate, setShowPhoneUpdate] = useState(false)
    const [newPhone, setNewPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [currentUsername, setCurrentUsername] = useState<string | null>(null)
    const [usernameInput, setUsernameInput] = useState("")
    const [usernameEditing, setUsernameEditing] = useState(false)
    const [usernameLoading, setUsernameLoading] = useState(false)

    useEffect(() => {
        getUserProfileSummary().then((res) => {
            if (res.success && res.user) {
                setCurrentUsername((res.user as any).username ?? null)
            }
        })
    }, [])

    const currentProvider = session?.user?.phone
        ? getProviderName(detectPaymentMethod(session.user.phone) || "")
        : "";

    const handleSendOtp = async () => {
        if (!newPhone || newPhone.length < 10) {
            setError("Please enter a valid phone number")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await requestPhoneUpdate(newPhone)

            if (result.success) {
                setOtpSent(true)
                setSuccess("Verification code sent!")
            } else {
                setError(result.error || "Failed to send OTP")
            }
        } catch {
            setError("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmUpdate = async () => {
        if (!otp || otp.length !== 6) {
            setError("Please enter the 6-digit code")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await confirmPhoneUpdate(newPhone, otp)

            if (result.success) {
                setSuccess("Phone number updated successfully!")
                setShowPhoneUpdate(false)
                setNewPhone("")
                setOtp("")
                setOtpSent(false)
                // Refresh session to get updated phone
                await update()
            } else {
                setError(result.error || "Failed to update phone")
            }
        } catch {
            setError("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveUsername = async () => {
        if (!usernameInput.trim()) {
            setError("Please enter a username")
            return
        }

        setUsernameLoading(true)
        setError("")

        try {
            const result = await updateUsername(usernameInput)

            if (result.success) {
                setCurrentUsername(result.username ?? null)
                setUsernameEditing(false)
                setSuccess("Username updated!")
            } else {
                setError(result.error || "Failed to update username")
            }
        } catch {
            setError("An error occurred")
        } finally {
            setUsernameLoading(false)
        }
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/account/profile" className="p-2 hover:bg-accent hover:text-foreground rounded-full text-muted-foreground transition-all">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h2 className="text-3xl font-black mb-1">Account Settings</h2>
                    <p className="text-muted-foreground font-medium">Manage your account details</p>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {success}
                </div>
            )}

            {/* Username */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <AtSymbol className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Username</h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Shown on leaderboards & chat</p>
                        </div>
                    </div>
                    {!usernameEditing && (
                        <button
                            onClick={() => {
                                setUsernameInput(currentUsername || "")
                                setUsernameEditing(true)
                            }}
                            className="p-2 hover:bg-accent rounded-xl text-purple-400 transition-all"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {!usernameEditing ? (
                    <div className="bg-muted border border-border/50 rounded-2xl p-4">
                        {currentUsername ? (
                            <span className="text-foreground font-black text-lg">@{currentUsername}</span>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No username yet. Pick one so friends can find you on leaderboards and chat.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder="e.g. nsmq_king"
                            minLength={3}
                            maxLength={20}
                            className="w-full bg-card border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveUsername}
                                disabled={usernameLoading}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                            >
                                {usernameLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Save</>}
                            </button>
                            <button
                                onClick={() => {
                                    setUsernameEditing(false)
                                    setUsernameInput("")
                                }}
                                className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:bg-accent font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                            3-20 characters: letters, numbers and underscores only
                        </p>
                    </div>
                )}
            </div>

            {/* Current Phone Number */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Phone className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Phone Number</h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Primary Contact</p>
                        </div>
                    </div>
                    {!showPhoneUpdate && (
                        <button
                            onClick={() => setShowPhoneUpdate(true)}
                            className="p-2 hover:bg-accent rounded-xl text-purple-400 transition-all"
                        >
                            <Edit2 className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="bg-muted border border-border/50 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-foreground font-black text-lg">{session?.user?.phone || "N/A"}</span>
                        <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                            <Shield className="h-4 w-4" />
                            VERIFIED
                        </div>
                    </div>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        Provider: {currentProvider || "Unknown"}
                    </p>
                </div>
            </div>

            {/* Phone Update Form */}
            {showPhoneUpdate && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-foreground">Update Phone Number</h3>
                        <button
                            onClick={() => {
                                setShowPhoneUpdate(false)
                                setNewPhone("")
                                setOtp("")
                                setOtpSent(false)
                                setError("")
                                setSuccess("")
                            }}
                            className="text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* New Phone Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-black uppercase tracking-widest text-purple-300">New Phone Number</label>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="024XXXXXXX"
                                disabled={otpSent}
                                className="flex-1 bg-card border border-input rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:border-purple-500 focus:outline-none disabled:opacity-50"
                            />
                            {!otpSent && (
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading || !newPhone}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl transition-all whitespace-nowrap"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Code"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* OTP Input */}
                    {otpSent && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-black uppercase tracking-widest text-purple-300">Verification Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="flex-1 bg-card border border-input rounded-xl px-4 py-3 text-foreground text-lg tracking-widest placeholder-muted-foreground focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleConfirmUpdate}
                                    disabled={loading || !otp}
                                    className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-muted disabled:text-muted-foreground text-white font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Confirm</>}
                                </button>
                            </div>
                            <p className="text-xs text-purple-400/80 font-bold">
                                Enter the 6-digit code sent to {newPhone}
                            </p>
                        </div>
                    )}

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-400 font-bold">
                            Changing your phone number will update your primary contact account.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
