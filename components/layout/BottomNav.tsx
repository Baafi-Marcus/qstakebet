"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Zap, ScrollText, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBetSlip } from "@/lib/store/useBetSlip"
import { useRef, useLayoutEffect } from "react"
import gsap from "gsap"
import { haptics } from "@/lib/haptics"

const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Virtuals", icon: Zap, href: "/virtuals" },
    { label: "Bets", icon: ScrollText, href: "/account/bets" },
    { label: "Me", icon: User, href: "/account/profile" },
]

export function BottomNav() {
    const pathname = usePathname()
    const { selections, toggleSlip, isOpen } = useBetSlip()

    // Refs for animation
    const navRef = useRef<HTMLDivElement>(null)
    const indicatorRef = useRef<HTMLDivElement>(null)
    const itemsRef = useRef<(HTMLAnchorElement | null)[]>([])

    useLayoutEffect(() => {
        const activeIndex = navItems.findIndex(item => pathname === item.href)
        if (activeIndex !== -1 && itemsRef.current[activeIndex] && indicatorRef.current) {
            const activeItem = itemsRef.current[activeIndex]
            const bounds = activeItem.getBoundingClientRect()
            const navBounds = navRef.current?.getBoundingClientRect()

            if (navBounds) {
                gsap.to(indicatorRef.current, {
                    x: bounds.left - navBounds.left + (bounds.width / 2) - 16,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.8)",
                    opacity: 1
                })
            }
        } else if (indicatorRef.current) {
            gsap.to(indicatorRef.current, { opacity: 0, duration: 0.3 })
        }
    }, [pathname])

    if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) return null;

    const handleNavClick = () => {
        haptics.light()
    }

    const handleSlipToggle = (e: React.MouseEvent) => {
        haptics.medium()
        toggleSlip()
    }

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[100] lg:hidden" ref={navRef}>
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem]" />

            {/* Sliding Active Indicator */}
            <div
                ref={indicatorRef}
                className="absolute top-1 h-1 w-8 bg-purple-500 rounded-full blur-[2px] opacity-0"
                style={{ pointerEvents: 'none' }}
            />

            <div className="relative h-16 flex items-center justify-around px-2">
                {/* Home & Virtuals */}
                <div className="flex flex-1 justify-around">
                    {navItems.slice(0, 2).map((item, idx) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                ref={el => { itemsRef.current[idx] = el }}
                                onClick={handleNavClick}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all active:scale-90",
                                    isActive ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive && "fill-purple-400/20")} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Central Action: Slip */}
                <div className="relative -mt-8 flex flex-col items-center">
                    <button
                        onClick={handleSlipToggle}
                        className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-2xl relative overflow-hidden group",
                            isOpen || selections.length > 0
                                ? "bg-purple-600 text-white shadow-purple-600/40"
                                : "bg-slate-800 text-slate-400 border border-white/5"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Ticket className={cn("h-6 w-6 relative z-10", (isOpen || selections.length > 0) && "animate-pulse")} />

                        {/* Selection Count Badge */}
                        {selections.length > 0 && (
                            <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-purple-600 shadow-lg animate-in zoom-in">
                                {selections.length}
                            </div>
                        )}
                    </button>
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest mt-2",
                        isOpen ? "text-purple-400" : "text-slate-500"
                    )}>Slip</span>
                </div>

                {/* Bets & Profile */}
                <div className="flex flex-1 justify-around">
                    {navItems.slice(2).map((item, idx) => {
                        const actualIdx = idx + 2
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                ref={el => { itemsRef.current[actualIdx] = el }}
                                onClick={handleNavClick}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all active:scale-90",
                                    isActive ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive && "fill-purple-400/20")} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
