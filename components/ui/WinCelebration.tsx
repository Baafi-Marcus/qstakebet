"use client"

import React, { useEffect, useRef } from "react"
import gsap from "gsap"
import { Trophy, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface WinCelebrationProps {
    amount: number;
    isOpen: boolean;
    onClose: () => void;
}

export function WinCelebration({ amount, isOpen, onClose }: WinCelebrationProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const iconRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLHeadingElement>(null)
    const amountRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            const tl = gsap.timeline()

            // Initial state
            gsap.set(modalRef.current, { opacity: 0, scale: 0.8, y: 20 })
            gsap.set(iconRef.current, { scale: 0, rotation: -45 })
            gsap.set(textRef.current, { opacity: 0, y: 10 })
            gsap.set(amountRef.current, { opacity: 0, scale: 0.5 })

            // Entry animation
            tl.to(modalRef.current, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.6,
                ease: "back.out(1.7)"
            })
                .to(iconRef.current, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)"
                }, "-=0.3")
                .to(textRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4
                }, "-=0.5")
                .to(amountRef.current, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: "back.out(2)"
                }, "-=0.2")

            // Floating animation for icon
            gsap.to(iconRef.current, {
                y: -10,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            })
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div
                ref={modalRef}
                className="relative bg-slate-900 border border-purple-500/30 rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-[0_0_100px_rgba(168,85,247,0.2)] max-w-sm w-full"
            >
                <div className="absolute top-4 right-4">
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Animated Icon */}
                <div ref={iconRef} className="relative mb-8">
                    <div className="absolute inset-0 bg-yellow-400 blur-[40px] opacity-20 animate-pulse" />
                    <div className="h-24 w-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl relative">
                        <Trophy className="h-12 w-12 text-white fill-white/20" />
                    </div>
                </div>

                <h2 ref={textRef} className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Winner Winner!
                </h2>

                <div ref={amountRef} className="space-y-1">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">You Won</span>
                    <div className="text-6xl font-black text-white italic tabular-nums">
                        <span className="text-2xl not-italic mr-1 text-purple-500">GHS</span>
                        {amount.toFixed(2)}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="mt-10 w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                >
                    Claim Winnings
                </button>
            </div>
        </div>
    )
}
