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
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[45] animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Menu Content */}
            <div className="fixed left-0 right-0 top-[104px] bottom-0 lg:bottom-auto lg:max-h-[80vh] bg-slate-900 border-t border-white/5 z-50 overflow-y-auto no-scrollbar animate-in slide-in-from-top-4 duration-300">
                <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* Sidebar / Categories */}
                        <div className="lg:col-span-3 space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white tracking-widest uppercase">Browse</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors lg:hidden"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Sports Selection */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Trophy className="h-3 w-3" />
                                    By Sport
                                </h3>
                                <div className="grid grid-cols-1 gap-1">
                                    {SPORTS.map((sport) => (
                                        <Link
                                            key={sport.href}
                                            href={sport.href}
                                            onClick={onClose}
                                            className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <sport.icon className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                <span className="font-bold">{sport.label}</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Regions Grid */}
                        <div className="lg:col-span-9 space-y-8">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Map className="h-3 w-3" />
                                    By Region
                                </h3>
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-slate-500">
                                    <Search className="h-3 w-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Search Regions</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                                {REGIONS.map((region) => (
                                    <Link
                                        key={region.href}
                                        href={region.href}
                                        onClick={onClose}
                                        className="relative group overflow-hidden"
                                    >
                                        <div className="p-4 md:p-6 bg-slate-800/20 hover:bg-purple-600 border border-white/5 hover:border-purple-500 rounded-2xl md:rounded-3xl transition-all duration-300 flex flex-col items-start gap-4">
                                            <div className="h-8 w-8 rounded-xl bg-white/5 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                                                <LayoutGrid className="h-4 w-4 text-slate-400 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs md:text-sm font-black text-white uppercase tracking-tight leading-none mb-1">{region.label}</p>
                                                <p className="text-[9px] md:text-[10px] font-bold text-slate-500 group-hover:text-purple-200 uppercase tracking-widest">View Competitions</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
