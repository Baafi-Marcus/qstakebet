"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon as Home, UserIcon as User, BoltIcon as Zap, TrophyIcon as Trophy, ChatBubbleLeftRightIcon as MessageSquare } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"
import { useRef, useLayoutEffect } from "react"
import gsap from "gsap"
import { haptics } from "@/lib/haptics"

const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Fantasy", icon: Zap, href: "/fantasy" },
    { label: "Banter", icon: MessageSquare, href: "/chat" },
    { label: "Rankings", icon: Trophy, href: "/leaderboard" },
    { label: "Profile", icon: User, href: "/account/profile" },
]

export function BottomNav() {
    const pathname = usePathname()

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

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[100] lg:hidden" ref={navRef}>
            {/* Glassmorphic Background */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem]" />

            {/* Sliding Active Indicator */}
            <div
                ref={indicatorRef}
                className="absolute top-1 h-1 w-8 bg-primary rounded-full blur-[2px] opacity-0"
                style={{ pointerEvents: 'none' }}
            />

            <div className="relative h-16 flex items-center justify-around px-2">
                {navItems.map((item, idx) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            ref={el => { itemsRef.current[idx] = el }}
                            onClick={handleNavClick}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all active:scale-90 flex-1",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
