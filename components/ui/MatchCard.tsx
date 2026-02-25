"use client"

import React from "react"
import Link from "next/link"
import { Zap } from "lucide-react"
import { OddsButton } from "./OddsButton"
import { Match } from "@/lib/types"
import { Selection } from "@/lib/store/useBetSlip"

export function MatchCard({
    match,
    onOddsClick,
    checkSelected
}: {
    match: Match,
    onOddsClick?: (selection: Selection) => void,
    checkSelected?: (selectionId: string) => boolean
}) {
    // Format time (simple helper)
    const timeDisplay = match.isLive
        ? <span className="text-red-500 font-bold animate-pulse">LIVE</span>
        : match.isVirtual
            ? <span className="text-purple-400 font-bold flex items-center gap-1"><Zap className="h-3 w-3" /> VIRTUAL</span>
            : <span className="text-muted-foreground">{match.startTime}</span>

    const matchLabel = match.participants.map(p => p.name).join(' vs ')

    return (
        <div className="bg-slate-900 border border-white/5 rounded-[2rem] shadow-xl hover:border-purple-500/30 transition-all duration-300 p-6 group">
            <div className="flex justify-between items-center mb-4 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                <span className="bg-white/5 px-2.5 py-1 rounded-full">{match.stage}</span>
                {timeDisplay}
            </div>

            <div className="flex items-center justify-center gap-4 mb-8 text-center flex-wrap">
                {match.participants.map((p, idx) => (
                    <React.Fragment key={p.schoolId}>
                        <div className="flex-1 min-w-[80px]">
                            <div className="text-sm font-black text-white uppercase tracking-tighter leading-tight line-clamp-2 h-8 flex items-center justify-center">
                                {p.name}
                            </div>
                        </div>
                        {idx < match.participants.length - 1 && (
                            <div className="text-slate-700 font-bold text-[9px] uppercase tracking-widest">VS</div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className={`grid gap-2.5 ${match.participants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {match.participants.map((p, idx) => (
                    <OddsButton
                        key={p.schoolId}
                        label={match.isVirtual ? (idx + 1).toString() : p.name}
                        odds={p.odd}
                        matchId={match.id}
                        matchLabel={matchLabel}
                        marketName="Match Winner"
                        showLabel={match.isVirtual}
                        onClick={onOddsClick}
                        isSelected={checkSelected?.(`${match.id}-Match Winner-${match.isVirtual ? (idx + 1).toString() : p.name}`)}
                        tournamentName={match.tournamentName || undefined}
                        stage={match.stage}
                    />
                ))}
            </div>

            <div className="mt-3 text-center">
                <Link href={`/matches/${match.id}`} className="text-xs text-primary hover:text-blue-400 hover:underline transition-colors block w-full py-1">
                    View more markets +
                </Link>
            </div>
        </div>
    )
}
