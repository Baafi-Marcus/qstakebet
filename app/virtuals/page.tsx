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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">

                    {/* NSMQ Virtuals Card */}
                    <Link href="/virtuals/nsmq" className="group relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all hover:bg-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_80px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col">
                        <div className="aspect-[16/10] relative overflow-hidden">
                            <img
                                src="/images/virtuals/nsmq-hub.png"
                                alt="NSMQ Showdown"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 pt-2 relative z-10 flex flex-col gap-2">
                            <h2 className="text-2xl font-black uppercase tracking-widest group-hover:text-emerald-400 transition-colors">NSMQ Showdown</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">3-School Science & Maths Virtual Format. Instant simulation. Speed race dynamics.</p>
                        </div>
                    </Link>

                    {/* Q-DARTS Card */}
                    <Link href="/virtuals/q-darts" className="group relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all hover:bg-slate-800 hover:border-purple-500/50 hover:shadow-[0_0_80px_rgba(168,85,247,0.1)] overflow-hidden flex flex-col">
                        <div className="aspect-[16/10] relative overflow-hidden">
                            <img
                                src="/images/virtuals/q-darts-hub.png"
                                alt="Q-DARTS"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-6 flex items-end gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 backdrop-blur-md border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <Target className="h-6 w-6" />
                                </div>
                                <div className="px-3 py-1 bg-purple-600 border border-purple-400/50 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-1 shadow-[0_0_20px_rgba(168,85,247,0.5)]">New</div>
                            </div>
                        </div>
                        <div className="p-8 pt-2 relative z-10 flex flex-col gap-2">
                            <h2 className="text-2xl font-black uppercase tracking-widest group-hover:text-purple-400 transition-colors">Q-DARTS</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Fast 2-Player Darts. 55-Second Continuous Loop. Live Animation.</p>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    )
}
