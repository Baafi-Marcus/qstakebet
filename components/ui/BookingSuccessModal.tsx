
"use client"
import React from "react"
import { X, Copy, Share2, Download, Send, Activity, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingSuccessModalProps {
    code: string
    selections: any[]
    totalOdds: number
    onClose: () => void
}

export function BookingSuccessModal({ code, selections, totalOdds, onClose }: BookingSuccessModalProps) {
    if (!code) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-black italic tracking-tighter text-2xl">QSTAKE</span>
                        <span className="bg-white/20 text-[10px] text-white px-1.5 rounded font-bold uppercase">Booking</span>
                    </div>
                    <button onClick={onClose} className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/50">
                        <Activity className="h-8 w-8 text-green-500" />
                    </div>

                    <h2 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">Booking Code Generated</h2>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 mb-6 relative group cursor-pointer hover:border-green-500/50 transition-colors"
                        onClick={() => {
                            navigator.clipboard.writeText(code)
                            alert("Code copied!")
                        }}>
                        <span className="text-5xl font-black text-white tracking-widest font-mono">{code}</span>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                            <span className="text-white text-xs font-bold flex items-center gap-2"><Copy className="h-4 w-4" /> Copy Code</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Total Odds</span>
                            <span className="text-2xl font-black text-white">{totalOdds.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Selections</span>
                            <span className="text-2xl font-black text-white">{selections.length}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="py-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`https://qstakebet.com/book/${code}`)
                                alert("Link copied!")
                            }}
                            className="py-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <Share2 className="h-4 w-4" /> Share
                        </button>
                    </div>

                    <p className="mt-6 text-[10px] text-slate-500 max-w-[250px] leading-relaxed">
                        Share this code with friends or take it to a terminal to place your bet. Odds are subject to change.
                    </p>
                </div>
            </div>
        </div>
    )
}
