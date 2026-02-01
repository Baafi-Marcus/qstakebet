"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Smartphone, KeyRound, Loader2, ArrowRight } from "lucide-react"

export default function AdminLoginPage() {
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                phone,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Authorization failed. Metadata mismatch.")
            } else {
                router.push("/admin")
            }
        } catch (err) {
            setError("Critical authentication failure.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none" />
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-slate-900 border border-white/5 mb-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <ShieldAlert className="h-10 w-10 text-primary relative z-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Command Center</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Restricted Administrative Access Only</p>
                </div>

                <div className="bg-slate-900 font-bold border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Registry Phone</label>
                            <div className="relative">
                                <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                                <input
                                    type="text"
                                    required
                                    className="w-full h-16 bg-slate-950 border border-white/5 rounded-3xl pl-16 pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:border-primary/50 transition-all text-sm font-mono"
                                    placeholder="024 000 0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Access Key</label>
                            <div className="relative">
                                <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                                <input
                                    type="password"
                                    required
                                    className="w-full h-16 bg-slate-950 border border-white/5 rounded-3xl pl-16 pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:border-primary/50 transition-all text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                                {error}
                            </div>
                        )}

                        <button
                            disabled={loading}
                            className="w-full h-16 bg-primary text-slate-950 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl shadow-primary/20"
                        >
                            {loading ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    Authorize Access
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center px-8">
                    <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase tracking-wider">
                        By authorizing, you agree to technical audit and monitoring.
                        Unauthorized access attempts will be terminated.
                    </p>
                </div>
            </div>
        </div>
    )
}
