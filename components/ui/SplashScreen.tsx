"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function SplashScreen({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState(true)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        // Only show the splash once per session
        const hasShown = typeof window !== 'undefined' ? sessionStorage.getItem('qstake_splash_shown') : null

        if (hasShown) {
            const skipTimer = setTimeout(() => {
                setShow(false)
            }, 0)
            return () => clearTimeout(skipTimer)
        }

        const animationTimer = setTimeout(() => {
            setAnimate(true)
        }, 80)

        const timer = setTimeout(() => {
            sessionStorage.setItem('qstake_splash_shown', 'true')
            setShow(false)
        }, 900)

        return () => {
            clearTimeout(animationTimer)
            clearTimeout(timer)
        }
    }, [])

    if (!show) return <>{children}</>

    return (
        <div className={cn(
            "fixed inset-0 z-[9999] bg-background flex items-center justify-center transition-all duration-500",
            animate ? "opacity-100 scale-100" : "opacity-0 scale-105"
        )}>
            <div className={cn(
                "flex flex-col items-center gap-5 transition-all duration-500",
                animate ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
                <Image
                    src="/icon.png"
                    alt="QSTAKE Logo"
                    width={96}
                    height={96}
                    priority
                    className="h-16 w-16 md:h-20 md:w-20 object-contain"
                />
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground font-russo">
                    QSTAKEbet
                </h1>
            </div>
        </div>
    )
}