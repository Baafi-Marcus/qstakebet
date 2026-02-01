"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, Mail, Lock, User, Phone, AlertCircle, Key } from "lucide-react"
import { registerAdmin } from "@/lib/auth-actions"

export default function AdminRegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
        adminToken: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (!formData.adminToken) {
            setError("Admin Security Token is required")
            return
        }

        setLoading(true)

        try {
            const result = await registerAdmin({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                adminToken: formData.adminToken
            })

            if (!result.success) {
                setError(result.error || "Registration failed")
                setLoading(false)
                return
            }

            router.push("/admin")
            router.refresh()
        } catch {
            setError("An error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20 mb-6 group hover:scale-110 transition-transform">
                        <ShieldCheck className="h-10 w-10 text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Admin Induction</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Authorized Personnel Only</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    {/* Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] -mr-16 -mt-16" />

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Admin Name"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        required
                                        type="tel"
                                        placeholder="Number"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    required
                                    type="email"
                                    placeholder="admin@qstake.bet"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        required
                                        type="password"
                                        placeholder="······"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="password"
                                        placeholder="······"
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-4 pr-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Security Induction Token</label>
                            <div className="relative mt-2">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                                <input
                                    required
                                    type="password"
                                    placeholder="Enter Admin Secret"
                                    className="w-full bg-orange-400/5 border border-orange-400/20 rounded-2xl py-4 pl-11 pr-4 text-sm text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all placeholder:text-orange-950"
                                    value={formData.adminToken}
                                    onChange={(e) => setFormData({ ...formData, adminToken: e.target.value })}
                                />
                            </div>
                            <p className="text-[10px] text-slate-600 font-bold mt-2 ml-1 italic">* This token is provided by the server administrator.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-orange-500/10 active:scale-[0.98] uppercase tracking-widest text-sm"
                        >
                            {loading ? "Authenticating Authority..." : "Initialize Admin Access"}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-12">
                    <Link href="/auth/login" className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                        Back to secure login
                    </Link>
                </div>
            </div>
        </div>
    )
}
