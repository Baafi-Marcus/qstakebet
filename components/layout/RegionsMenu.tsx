"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { TrophyIcon as Trophy, ChevronRightIcon as ChevronRight, ChevronDownIcon as ChevronDown, XMarkIcon as X } from "@heroicons/react/24/solid";
import { MapIcon as Map, FlagIcon as Flag } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils"
import { getMatchStatsByRegion } from "@/lib/match-stats"

interface RegionsMenuProps {
    isOpen: boolean
    onClose: () => void
    topOffset?: number
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

export function RegionsMenu({ isOpen, onClose, topOffset = 104 }: RegionsMenuProps) {
    const [expandedRegion, setExpandedRegion] = React.useState<string | null>(null)
    const [stats, setStats] = React.useState<Record<string, Record<string, number>>>({})
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            getMatchStatsByRegion().then(setStats)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!mounted || !isOpen) return null

    const menuContent = (
        <div className="fixed inset-0 z-[10000] flex flex-col pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
                onClick={onClose}
            />

            {/* Menu Container */}
            <div
                className="relative w-full flex-1 bg-popover border-t border-border overflow-y-auto no-scrollbar pointer-events-auto shadow-2xl flex flex-col"
                style={{ marginTop: `${topOffset}px` }}
            >
                <div className="flex flex-col flex-1">
                    {/* Header Area */}
                    <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-popover z-10">
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Select Region & Sport</h3>
                        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* List Area */}
                    <div className="divide-y divide-border pb-20">
                        {REGIONS.map((region) => {
                            const regionStats = stats[region.label] || { total: 0 }
                            const isExpanded = expandedRegion === region.label

                            return (
                                <div key={region.label} className="w-full">
                                    {/* Region Row */}
                                    <button
                                        onClick={() => setExpandedRegion(isExpanded ? null : region.label)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-5 hover:bg-accent/50 transition-colors group",
                                            isExpanded && "bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                                                isExpanded ? "bg-purple-600" : "bg-muted group-hover:bg-muted/70"
                                            )}>
                                                <Map className={cn("h-4 w-4", isExpanded ? "text-white" : "text-muted-foreground")} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-foreground uppercase tracking-tight">{region.label}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {regionStats.total} {regionStats.total === 1 ? 'Match' : 'Matches'} Available
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown className={cn(
                                            "h-4 w-4 text-muted-foreground/70 transition-transform duration-300",
                                            isExpanded && "rotate-180 text-purple-500"
                                        )} />
                                    </button>

                                    {/* Nested Sports (Accordion Content) */}
                                    {isExpanded && (
                                        <div className="bg-background/40 border-t border-border">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
                                                {SPORTS.map((sport) => {
                                                    const sportCount = regionStats[sport.label.toLowerCase()] || 0
                                                    const sportHref = `${region.href}/${sport.label.toLowerCase()}`

                                                    return (
                                                        <Link
                                                            key={sport.label}
                                                            href={sportHref}
                                                            onClick={onClose}
                                                            className="flex items-center justify-between p-4 bg-popover hover:bg-purple-600/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <sport.icon className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 group-hover:scale-110 transition-all" />
                                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground uppercase transition-colors">{sport.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-muted-foreground/70 group-hover:text-purple-500">{sportCount}</span>
                                                                <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                                                            </div>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(menuContent, document.body)
}

