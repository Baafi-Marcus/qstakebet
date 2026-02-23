"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Trophy,
    Map,
    Flag,
    Star,
    Zap,
    Timer,
    ChevronDown,
    LayoutGrid,
    X
} from "lucide-react"
import { RegionsMenu } from "./RegionsMenu"

const SPORTS = [
    { label: "Football", icon: Trophy, href: "/sports/football" },
    { label: "Basketball", icon: Trophy, href: "/sports/basketball" },
    { label: "Athletics", icon: Map, href: "/sports/athletics" },
    { label: "Volleyball", icon: Trophy, href: "/sports/volleyball" },
    { label: "Handball", icon: Trophy, href: "/sports/handball" },
    { label: "Academic Quiz", icon: Flag, href: "/sports/quiz" },
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

export function SubNavBar() {
    const pathname = usePathname()
    const [isRegionsOpen, setIsRegionsOpen] = useState(false)

    return (
        <div className={cn(
            "w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-14",
            isRegionsOpen ? "z-[9999]" : "z-40"
        )}>
            <div className="max-w-[1400px] mx-auto px-4 flex items-center h-12 gap-2 sm:gap-6">
                {/* Scrollable Content Container */}
                <div className="flex-1 overflow-x-auto no-scrollbar pr-2">
                    <div className="flex items-center h-full gap-4 sm:gap-6">
                        {/* Main Sections */}
                        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-white/10 pr-2 sm:pr-4">
                            <Link
                                href="/"
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap", // Removed transition-all
                                    pathname === "/"
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                        : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                FEATURED
                            </Link>
                            <Link
                                href="/live"
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all whitespace-nowrap",
                                    pathname === "/live"
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                        : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                LIVE MATCHES
                            </Link>
                            <Link
                                href="/virtuals"
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all whitespace-nowrap text-emerald-400 hover:text-emerald-300",
                                    pathname === "/virtuals" && "bg-emerald-500/10"
                                )}
                            >
                                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                VIRTUALS
                            </Link>
                        </div>

                        {/* Sports Horizontal List */}
                        <div className="flex items-center gap-3 sm:gap-4 py-1">
                            {SPORTS.map((sport) => {
                                const Icon = sport.icon
                                const isActive = pathname === sport.href
                                return (
                                    <Link
                                        key={sport.href}
                                        href={sport.href}
                                        className={cn(
                                            "flex items-center gap-1.5 px-0.5 py-1 text-[9px] sm:text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-tighter",
                                            isActive ? "text-purple-400 border-b-2 border-purple-400" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        {sport.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Pinned Regions Toggle */}
                <div className="shrink-0">
                    <button
                        onClick={() => setIsRegionsOpen(!isRegionsOpen)}
                        className={cn(
                            "flex items-center gap-1.5 px-2 sm:px-4 py-1.5 rounded-full border text-[9px] sm:text-[11px] font-black tracking-widest uppercase transition-all",
                            isRegionsOpen
                                ? "bg-white text-black border-white"
                                : "bg-transparent text-white border-white/20 hover:border-white/40"
                        )}
                    >
                        <LayoutGrid className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden xs:inline">REGIONS</span>
                        <span className="xs:hidden">REG</span>
                        <ChevronDown className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-200", isRegionsOpen && "rotate-180")} />
                    </button>
                </div>
            </div>

            {/* Mega Menu Overlay */}
            <RegionsMenu
                isOpen={isRegionsOpen}
                onClose={() => setIsRegionsOpen(false)}
            />
        </div>
    )
}

