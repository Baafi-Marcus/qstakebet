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
                    <Link href="/virtuals/nsmq" className="group relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all hover:bg-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_80px_rgba(16,185,129,0.15)] overflow-hidden aspect-[16/10]">
                        <img
                            src="/images/virtuals/nsmq-hub.png"
                            alt="NSMQ Showdown"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    </Link>

                    {/* Q-DARTS Card */}
                    <Link href="/virtuals/q-darts" className="group relative bg-slate-900 border border-white/10 rounded-[2.5rem] transition-all hover:bg-slate-800 hover:border-purple-500/50 hover:shadow-[0_0_80px_rgba(168,85,247,0.15)] overflow-hidden aspect-[16/10]">
                        <img
                            src="/images/virtuals/q-darts-hub.png"
                            alt="Q-DARTS"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    </Link>

                </div>
            </div>
        </div>
    )
}
