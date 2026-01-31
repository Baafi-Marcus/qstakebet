"use client"

import Link from "next/link"
import { Trophy, Map, Flag, Star, Zap, Timer } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const MAIN_MENU = [
    { label: "Featured", icon: Star, href: "/" },
    { label: "Live Matches", icon: Timer, href: "/live" },
    { label: "Instant Virtuals", icon: Zap, href: "/virtuals" },
]

const REGIONS = [
    { label: "Ahafo", href: "/competitions/ahafo" },
    { label: "Ashanti", href: "/competitions/ashanti" },
    { label: "Bono", href: "/competitions/bono" },
    { label: "Bono East", href: "/competitions/bono-east" },
    { label: "Central", href: "/competitions/central" },
    { label: "Eastern", href: "/competitions/eastern" },
    { label: "Greater Accra", href: "/competitions/greater-accra" },
    { label: "North East", href: "/competitions/north-east" },
    { label: "Northern", href: "/competitions/northern" },
    { label: "Oti", href: "/competitions/oti" },
    { label: "Savannah", href: "/competitions/savannah" },
    { label: "Upper East", href: "/competitions/upper-east" },
    { label: "Upper West", href: "/competitions/upper-west" },
    { label: "Volta", href: "/competitions/volta" },
    { label: "Western", href: "/competitions/western" },
    { label: "Western North", href: "/competitions/western-north" },
    { label: "National", href: "/competitions/national" },
]

const SPORTS = [
    { label: "Football", icon: Trophy, href: "/sports/football" },
    { label: "Basketball", icon: Trophy, href: "/sports/basketball" },
    { label: "Athletics", icon: Map, href: "/sports/athletics" },
    { label: "Volleyball", icon: Trophy, href: "/sports/volleyball" },
    { label: "Handball", icon: Trophy, href: "/sports/handball" },
    { label: "Academic Quiz", icon: Flag, href: "/sports/quiz" },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden border-r border-border bg-card/40 lg:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto py-6 px-4 custom-scrollbar">
            <div className="space-y-6">
                {/* Main Menu */}
                <div className="px-3">
                    <div className="space-y-1">
                        {MAIN_MENU.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                                        isActive
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Sports Hierarchy */}
                <div className="px-3">
                    <h2 className="mb-3 px-4 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Top Sports
                    </h2>
                    <div className="space-y-1">
                        {SPORTS.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Regional Hierarchy */}
                <div className="px-3">
                    <h2 className="mb-3 px-4 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                        Regions
                    </h2>
                    <div className="space-y-1">
                        {REGIONS.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all",
                                        isActive
                                            ? "text-purple-400"
                                            : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    <ChevronRight className="mr-2 h-3 w-3 opacity-30" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="px-7 pt-4">
                    <Link
                        href="/admin"
                        className="text-[10px] font-black text-slate-600 hover:text-purple-400 transition-colors uppercase tracking-[0.2em] border-t border-white/5 pt-4 block"
                    >
                        Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

import { ChevronRight } from "lucide-react"
