"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState(true)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        // Start animation after a brief delay to avoid synchronous setState warning
        const animationTimer = setTimeout(() => {
            setAnimate(true)
        }, 100)

        // Hide splash screen after delay
        const timer = setTimeout(() => {
            setShow(false)
        }, 3000) // 3 seconds total duration

        return () => {
            clearTimeout(animationTimer)
            clearTimeout(timer)
        }
    }, [])

    if (!show) return <>{children}</>

    return (
        <>
            <div className={cn(
                "fixed inset-0 z-[9999] bg-[#0f1115] flex items-center justify-center transition-opacity duration-700 ease-out",
                animate ? "opacity-100" : "opacity-0"
            )}>
                <div className={cn(
                    "flex flex-col items-center justify-center transition-all duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) transform",
                    animate ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}>

                    {/* Full Text Branding - No Icon */}
                    <div className="flex flex-col items-center relative">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />

                        <h1 className="relative text-5xl md:text-8xl tracking-tight text-white font-russo">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 animate-gradient-x">QSTAKEbet</span>
                        </h1>

                        <p className="relative text-slate-500 text-xs md:text-sm font-bold uppercase tracking-[0.5em] mt-4 animate-pulse">
                            Premium Prediction Platform
                        </p>
                    </div>
                </div>
            </div>

            {/* Hide main content while loading */}
            <div className="hidden">
                {children}
            </div>
        </>
    )
}
