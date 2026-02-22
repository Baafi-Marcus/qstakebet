"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Announcement } from "@/lib/types" // Using central types
import { cn } from "@/lib/utils"

interface AdBannerCarouselProps {
    announcements: Announcement[]
}

const AD_THEMES: Record<string, string> = {
    default: "bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40",
    neon: "bg-black border-y border-purple-500/30 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_70%)]",
    gold: "bg-gradient-to-br from-[#1a1600] via-[#4d3d00] to-[#1a1600] border-y border-yellow-500/20",
    cyber: "bg-[#050505] bg-[linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:20px_20px]",
    minimal: "bg-[#0f1115] border-y border-white/5",
    fire: "bg-gradient-to-r from-orange-900/40 via-red-900/40 to-orange-900/40"
}

const THEME_TEXT: Record<string, string> = {
    default: "text-white italic",
    neon: "text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] uppercase font-black",
    gold: "text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] font-serif italic",
    cyber: "text-cyan-400 font-mono uppercase tracking-[0.2em]",
    minimal: "text-slate-200 font-medium tracking-tight",
    fire: "text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] font-black italic uppercase"
}

export function AdBannerCarousel({ announcements }: AdBannerCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const next = useCallback(() => {
        setCurrentIndex((current) => (current + 1) % announcements.length)
    }, [announcements.length])

    const prev = useCallback(() => {
        setCurrentIndex((current) => (current - 1 + announcements.length) % announcements.length)
    }, [announcements.length])

    useEffect(() => {
        if (!isPaused && announcements.length > 1) {
            const timer = setInterval(next, 5000)
            return () => clearInterval(timer)
        }
    }, [isPaused, announcements.length, next])

    if (!announcements || announcements.length === 0) return null

    return (
        <div
            className="w-full bg-[#0f1115] overflow-hidden border-b border-white/5 relative group h-[120px] md:h-[200px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Ad Content */}
            <div className="w-full h-full relative">
                {announcements.map((ad, index) => {
                    const isActive = index === currentIndex
                    const themeClass = AD_THEMES[ad.style || "default"] || AD_THEMES.default
                    const textClass = THEME_TEXT[ad.style || "default"] || THEME_TEXT.default

                    // Smart Font Sizing based on content length
                    const contentLength = ad.content?.length || 0
                    let fontSize = "text-xl md:text-4xl"
                    if (contentLength > 50) fontSize = "text-lg md:text-2xl"
                    else if (contentLength > 30) fontSize = "text-xl md:text-3xl"

                    return (
                        <div
                            key={ad.id}
                            className={cn(
                                "absolute inset-0 transition-all duration-700 ease-in-out flex items-center justify-center",
                                isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                            )}
                        >
                            {ad.type === "image" ? (
                                <div className="w-full h-full relative cursor-pointer">
                                    {ad.link ? (
                                        <Link href={ad.link} className="block w-full h-full">
                                            <img
                                                src={ad.imageUrl || ""}
                                                alt="Promotion"
                                                className="w-full h-full object-cover"
                                            />
                                        </Link>
                                    ) : (
                                        <img
                                            src={ad.imageUrl || ""}
                                            alt="Promotion"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className={cn(
                                    "w-full h-full flex flex-col items-center justify-center text-center px-8 sm:px-12 md:px-20",
                                    themeClass
                                )}>
                                    <h3 className={cn(
                                        "font-black tracking-tighter mb-2 leading-tight transition-transform duration-1000",
                                        textClass,
                                        fontSize,
                                        isActive ? "scale-100 opacity-100" : "scale-95 opacity-0"
                                    )}>
                                        {ad.content}
                                    </h3>
                                    {ad.link && (
                                        <Link
                                            href={ad.link}
                                            className="flex items-center gap-2 text-[10px] md:text-xs font-black text-primary uppercase tracking-widest hover:text-white transition-all hover:scale-105"
                                        >
                                            Check it out <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Navigation Controls (Only if > 1 ad) */}
            {announcements.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 hidden md:block z-20"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/50 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 hidden md:block z-20"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {announcements.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-300",
                                    i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
