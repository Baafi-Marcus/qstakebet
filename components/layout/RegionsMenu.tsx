"use client"

import React from "react"
import Link from "next/link"
import {
    Trophy,
    Map,
    Flag,
    ChevronRight,
    X,
    LayoutGrid,
    Search
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RegionsMenuProps {
    isOpen: boolean
    onClose: () => void
}

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

export function RegionsMenu({ isOpen, onClose }: RegionsMenuProps) {
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300 lg:hidden"
                onClick={onClose}
            />

            {/* Menu Content */}
            <div className="fixed left-0 right-0 top-[104px] bottom-0 lg:bottom-auto lg:max-h-[85vh] bg-slate-900 border-t border-white/10 z-50 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-200">
                <div className="w-full max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12">

                        {/* Sports Section - Top/Left */}
                        <div className="lg:col-span-3 border-r border-white/5 bg-slate-900/50">
                            <div className="p-4 lg:p-6 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Trophy className="h-3 w-3" />
                                        Categories
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/5 rounded-full text-slate-500 lg:hidden"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                                    {SPORTS.map((sport) => (
                                        <Link
                                            key={sport.href}
                                            href={sport.href}
                                            onClick={onClose}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group min-w-[140px] lg:min-w-0"
                                        >
                                            <sport.icon className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-bold whitespace-nowrap">{sport.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Regions List - Main Area */}
                        <div className="lg:col-span-9 bg-slate-900">
                            <div className="p-4 lg:p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Map className="h-3 w-3" />
                                        All Regions
                                    </h3>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-slate-500">
                                        <Search className="h-3 w-3" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Search</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-y divide-white/5 xs:divide-y-0">
                                    {REGIONS.map((region) => (
                                        <Link
                                            key={region.href}
                                            href={region.href}
                                            onClick={onClose}
                                            className="flex items-center justify-between p-4 hover:bg-purple-600/10 group transition-all border-b border-white/5 sm:border-b-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                                    <LayoutGrid className="h-3.5 w-3.5 text-slate-500 group-hover:text-white" />
                                                </div>
                                                <span className="text-xs font-black text-slate-200 group-hover:text-white uppercase tracking-tight">{region.label}</span>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
