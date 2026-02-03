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
    LayoutGrid
} from "lucide-react"

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
        <div className="w-full bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-14 z-40">
            <div className="max-w-[1400px] mx-auto px-4">
                <div className="flex items-center h-12 gap-6 overflow-x-auto no-scrollbar">
                    {/* Main Sections */}
                    <div className="flex items-center gap-1 border-r border-white/10 pr-4">
                        <Link
                            href="/"
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap",
                                pathname === "/"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Star className="h-3.5 w-3.5" />
                            FEATURED
                        </Link>
                        <Link
                            href="/live"
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap",
                                pathname === "/live"
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Timer className="h-3.5 w-3.5" />
                            LIVE
                        </Link>
                        <Link
                            href="/virtuals"
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap text-emerald-400 hover:text-emerald-300",
                                pathname === "/virtuals" && "bg-emerald-500/10"
                            )}
                        >
                            <Zap className="h-3.5 w-3.5" />
                            VIRTUALS
                        </Link>
                    </div>

                    {/* Sports Horizontal List */}
                    <div className="flex items-center gap-4">
                        {SPORTS.map((sport) => {
                            const Icon = sport.icon
                            const isActive = pathname === sport.href
                            return (
                                <Link
                                    key={sport.href}
                                    href={sport.href}
                                    className={cn(
                                        "flex items-center gap-2 px-1 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-tighter",
                                        isActive ? "text-purple-400 border-b-2 border-purple-400" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {sport.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Regions Dropdown */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setIsRegionsOpen(!isRegionsOpen)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-black tracking-widest uppercase transition-all",
                                isRegionsOpen
                                    ? "bg-white text-black border-white"
                                    : "bg-transparent text-white border-white/20 hover:border-white/40"
                            )}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            REGIONS
                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isRegionsOpen && "rotate-180")} />
                        </button>

                        {isRegionsOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsRegionsOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 gap-1">
                                        {REGIONS.map((region) => (
                                            <Link
                                                key={region.href}
                                                href={region.href}
                                                onClick={() => setIsRegionsOpen(false)}
                                                className="px-3 py-2 text-[10px] font-bold text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                                            >
                                                {region.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
