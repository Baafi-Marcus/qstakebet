"use client"

import React, { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { Bell, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveScoreToastProps {
    matchLabel: string;
    newScore: string;
    teamName: string;
}

export function LiveScoreToast({ matchLabel, newScore, teamName }: LiveScoreToastProps) {
    const toastRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            gsap.to(toastRef.current, {
                y: 100,
                opacity: 0,
                duration: 0.5,
                onComplete: () => setIsVisible(false)
            })
        }, 5000)

        gsap.fromTo(toastRef.current,
            { y: 100, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        )

        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div
            ref={toastRef}
            className="fixed bottom-24 left-4 right-4 z-[150] md:left-auto md:right-8 md:w-80"
        >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 overflow-hidden relative">
                {/* Glow Effect */}
                <div className="absolute inset-y-0 left-0 w-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />

                <div className="h-10 w-10 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-purple-400 fill-purple-400/20 animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live Goal: {matchLabel}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                        <span className="text-purple-400">{teamName}</span> scores!
                    </p>
                </div>

                <div className="text-xl font-black italic text-white pr-2 tabular-nums">
                    {newScore}
                </div>
            </div>
        </div>
    )
}
