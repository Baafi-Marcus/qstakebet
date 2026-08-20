"use client"

import React from "react"
import { Match } from "@/lib/types"

interface MatchDetailsModalProps {
    match: Match
    onClose: () => void
    onOddsClick: (selection: any) => void
    checkSelected: (id: string) => boolean
    checkIsCorrelated?: (matchId: string, marketName: string) => boolean
}

export function MatchDetailsModal({ match, onClose }: MatchDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-card p-4 rounded-xl max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-foreground">Match Details</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">Close</button>
                </div>
                <div className="text-foreground/80 text-sm">
                    {match.participants.map(p => p.name).join(" vs ")}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                    Predictions coming soon.
                </div>
            </div>
        </div>
    )
}
