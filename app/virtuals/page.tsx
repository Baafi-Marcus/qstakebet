import React from "react"
import Link from "next/link"
import { ArrowLeft, Target, GraduationCap } from "lucide-react"

export default function VirtualsHubPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl mx-auto space-y-8">

                <header className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <Link href="/" className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all border border-white/5 active:scale-95">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Instant Virtuals</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Select your arena</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                    {/* NSMQ Virtuals Card */}
                    <Link href="/virtuals/nsmq" className="group relative bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 transition-all hover:bg-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-emerald-500/20" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">NSMQ Showdown</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">3-School Science & Maths Virtual Format. Instant simulation. Speed race dynamics.</p>
                            </div>
                        </div>
                    </Link>

                    {/* Q-DARTS Card */}
                    <Link href="/virtuals/q-darts" className="group relative bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 transition-all hover:bg-slate-800 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-purple-500/20" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                <Target className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest mb-1 group-hover:text-purple-400 transition-colors">Q-DARTS</h2>
                                <div className="inline-block px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded text-[9px] font-black text-purple-400 uppercase tracking-wider mb-2">New</div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Fast 2-Player Darts. 55-Second Continuous Loop. Live Animation.</p>
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    )
}
