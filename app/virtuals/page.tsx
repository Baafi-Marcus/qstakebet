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

                <div className="flex flex-wrap justify-center gap-10 md:gap-16 pt-8">
                    {/* NSMQ Virtuals Card */}
                    <Link href="/virtuals/nsmq" className="group flex flex-col items-center gap-4 transition-transform active:scale-95">
                        <div className="w-40 h-40 md:w-56 md:h-56 relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all group-hover:border-emerald-500/50 group-hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden">
                            <img
                                src="/images/virtuals/nsmq-hub.jpg"
                                alt="NSMQ Showdown"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-400 transition-colors">NSMQ Showdown</span>
                    </Link>

                    {/* Q-DARTS Card */}
                    <Link href="/virtuals/q-darts" className="group flex flex-col items-center gap-4 transition-transform active:scale-95">
                        <div className="w-40 h-40 md:w-56 md:h-56 relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all group-hover:border-purple-500/50 group-hover:shadow-[0_0_60px_rgba(168,85,247,0.2)] overflow-hidden">
                            <img
                                src="/images/virtuals/q-darts-hub.jpg"
                                alt="Q-DARTS"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-purple-400 transition-colors">Q-DARTS</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
