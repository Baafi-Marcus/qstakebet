"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState(true)
    const [animate, setAnimate] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusIdx, setStatusIdx] = useState(0)

    const statuses = [
        "Initializing Secure Environment",
        "Loading Market Engine",
        "Syncing Live Odds",
        "Optimizing UI Components",
        "Ready for Play"
    ]

    useEffect(() => {
        // Start animation after a brief delay
        const animationTimer = setTimeout(() => {
            setAnimate(true)
        }, 100)

        // Progress simulation
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressTimer)
                    return 100
                }
                const increment = Math.random() * 15
                return Math.min(prev + increment, 100)
            })
        }, 300)

        // Status simulation
        const statusTimer = setInterval(() => {
            setStatusIdx(prev => (prev < statuses.length - 1 ? prev + 1 : prev))
        }, 700)

        // Hide splash screen after delay
        const timer = setTimeout(() => {
            setShow(false)
        }, 3800)

        return () => {
            clearTimeout(animationTimer)
            clearInterval(progressTimer)
            clearInterval(statusTimer)
            clearTimeout(timer)
        }
    }, [])

    if (!show) return <>{children}</>

    return (
        <>
            <div className={cn(
                "fixed inset-0 z-[9999] bg-[#090b0f] flex items-center justify-center transition-all duration-1000 ease-in-out",
                animate ? "opacity-100 scale-100" : "opacity-0 scale-110"
            )}>
                {/* Cinematic Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
                </div>

                <div className={cn(
                    "flex flex-col items-center justify-center max-w-sm w-full px-8 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)",
                    animate ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}>

                    <div className="flex flex-col items-center relative w-full">
                        <h1 className="relative text-4xl md:text-6xl tracking-tighter text-white font-russo text-center">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-[length:200%_auto] animate-gradient-x">QSTAKEbet</span>
                        </h1>

                        <div className="w-full mt-12 space-y-4">
                            {/* High-end Progress Bar */}
                            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] h-4 flex items-center justify-center text-center">
                                    {statuses[statusIdx]}
                                </p>
                                <span className="text-[10px] text-slate-600 font-mono tabular-nums leading-none">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden content container to prevent layout jump when it appears */}
            <div className="fixed inset-0 -z-50 pointer-events-none opacity-0">
                {children}
            </div>
        </>
    )
}
