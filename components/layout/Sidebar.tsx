"use client"

import Link from "next/link"
import { Trophy, Map, Flag, Star, Zap, Timer } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const MENU_ITEMS = [
    { label: "Featured", icon: Star, href: "/" },
    { label: "Live Matches", icon: Timer, href: "/live" },
    { label: "Instant Virtuals", icon: Zap, href: "/virtuals" },
    { label: "Regional Qualifiers", icon: Map, href: "/competitions/regional" },
    { label: "Zonal Championships", icon: Flag, href: "/competitions/zonal" },
    { label: "National Finals", icon: Trophy, href: "/competitions/national" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r border-border bg-card/40 lg:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto py-6 px-4">
            <div className="space-y-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                        Competitions
                    </h2>
                    <div className="space-y-1">
                        {MENU_ITEMS.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-secondary text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-primary" : "")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                        Quick Links
                    </h2>
                    {/* Add more links if needed */}
                </div>
            </div>
        </div>
    )
}
