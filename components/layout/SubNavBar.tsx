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
    X,
    Ticket
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
    const [menuOffset, setMenuOffset] = useState(104)
    const navRef = React.useRef<HTMLDivElement>(null)

    React.useLayoutEffect(() => {
        if (isRegionsOpen && navRef.current) {
            setMenuOffset(navRef.current.getBoundingClientRect().bottom)
        }
    }, [isRegionsOpen])

    return (
        <div
            ref={navRef}
            className={cn(
                "w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-14",
                isRegionsOpen ? "z-[9999]" : "z-40"
            )}
        >
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

                {/* Pinned Regions Toggle & Load Code */}
                <div className="shrink-0 flex items-center gap-2">
                    <button
                        onClick={() => {
                            // Find the bet slip context and open it
                            const toggleBtn = document.querySelector('[data-betslip-toggle]') as HTMLButtonElement;
                            if (toggleBtn) toggleBtn.click();
                            else {
                                // Fallback: try to find any slip toggle via window/context if possible
                                // For now, we'll assume the context is available or we use a custom event
                                window.dispatchEvent(new CustomEvent('open-betslip'));
                            }
                        }}
                        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[11px] font-black tracking-widest uppercase hover:bg-purple-500 hover:text-white transition-all"
                    >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>LOAD CODE</span>
                    </button>

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
                topOffset={menuOffset}
            />
        </div>
    )
}

