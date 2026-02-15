"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, User, Zap, ScrollText, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    if (pathname === '/virtuals') return null;

    const navItems = [
        { label: "Home", icon: Home, href: "/" },
        { label: "Virtuals", icon: Zap, href: "/virtuals" },
        { label: "My Bets", icon: ScrollText, href: "/account/bets" },
        { label: "Rewards", icon: Gift, href: "/rewards" },
        { label: "Me", icon: User, href: "/account/profile" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border h-16 pb-safe lg:hidden shadow-lg">
            <div className="grid grid-cols-5 h-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
