"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
    User,
    Phone,
    Mail,
    Save,
    Loader2,
    ChevronLeft,
    CheckCircle2,
    AlertCircle
} from "lucide-react"
import { getUserProfileSummary, updateUserProfile } from "@/lib/user-actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "" // Email is usually read-only
    })

    useEffect(() => {
        getUserProfileSummary().then((res: any) => {
            if (res.success) {
                setFormData({
                    name: res.user.name || "",
                    phone: res.user.phone || "",
                    email: res.user.email || ""
                })
            }
            setLoading(false)
        })
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const res = await updateUserProfile({
                name: formData.name,
                phone: formData.phone
            })

            if (res.success) {
                setSuccess(true)
                // Update session client-side
                await update({ name: formData.name })
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(res.error || "Failed to update profile")
            }
        } catch (err) {
            setError("An unexpected error occurred")
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
        </div>
    )

    return (
        <div className="max-w-md mx-auto py-4">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/account/profile" className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-200 font-bold focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-200 font-bold focus:outline-none focus:border-purple-500/50 transition-all"
                                placeholder="024 XXX XXXX"
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field (Read Only) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                        <div className="relative opacity-60">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-400 font-bold cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[9px] text-slate-600 font-medium pl-1 italic">Email cannot be changed for security reasons.</p>
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-bold">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-bold">Profile updated successfully!</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{saving ? "SAVING..." : "SAVE CHANGES"}</span>
                </button>
            </form>
        </div>
    )
}
