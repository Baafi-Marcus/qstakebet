"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"

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
                animate ? "opacity-100" : "opacity-0" // Fades out at the end if controlled from parent, but here we unmount. 
                // We need a separate state for 'fading out' if we want a smooth exit, 
                // but standard opacity transition on unmount requires AnimatePresence or simpler CSS handling.
                // For simplicity, we just unmount after delay. 
                // To improve, we can add a 'fading' state.
            )}>
                {/* We can use a CSS animation for the fade out if we want, but for now let's focus on the entry zoom */}

                <div className={cn(
                    "flex items-center gap-4 transition-all duration-[2000ms] cubic-bezier(0.16, 1, 0.3, 1) transform",
                    animate ? "scale-100 opacity-100" : "scale-50 opacity-0"
                )}>
                    {/* Small Design Logo (Icon) */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-full animate-pulse" />
                        <div className="relative h-14 w-14 md:h-16 md:w-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                            <Trophy className="h-7 w-7 md:h-8 md:w-8 text-white drop-shadow-md" />
                        </div>
                    </div>

                    {/* Full Text Branding */}
                    <div className="flex flex-col">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">QSTAKE</span>
                            <span className="text-white">bet</span>
                        </h1>
                        <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-transparent rounded-full mt-1 animate-[width_2s_ease-out]" />
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
