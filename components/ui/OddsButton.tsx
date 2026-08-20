"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface OddsButtonProps {
    label: string
    odds?: number | null
    matchId: string
    marketName: string
    matchLabel?: string
    showLabel?: boolean
    isSelected?: boolean
    isCorrelated?: boolean
    onClick?: (selection: any) => void
    className?: string
    sportType?: string
    tournamentName?: string
    stage?: string
    id?: string
    tournamentId?: string
}

export function OddsButton({
    label,
    isSelected,
    onClick,
    className,
}: OddsButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                isSelected ? "bg-purple-600 text-white" : "bg-card text-foreground/80 hover:bg-muted",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick({ label });
            }}
        >
            <span className="text-xs font-bold">{label}</span>
        </button>
    )
}
