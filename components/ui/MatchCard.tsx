"use client"

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

    const matchLabel = `${match.schoolA} vs ${match.schoolB} vs ${match.schoolC}`

    return (
        <div className="bg-card border border-border rounded-lg shadow-sm hover:border-slate-600 transition-colors p-4">
            <div className="flex justify-between items-center mb-3 text-xs text-muted-foreground uppercase tracking-wider">
                <span>{match.stage}</span>
                {timeDisplay}
            </div>

            <div className="flex items-center justify-between mb-6 text-center">
                {/* School A */}
                <div className="flex-1">
                    <div className="text-sm md:text-md font-bold font-display text-foreground leading-tight line-clamp-2 h-10 flex items-center justify-center">
                        {match.schoolA}
                    </div>
                </div>

                <div className="px-1 text-[10px] text-muted-foreground font-mono">VS</div>

                {/* School B */}
                <div className="flex-1">
                    <div className="text-sm md:text-md font-bold font-display text-foreground leading-tight line-clamp-2 h-10 flex items-center justify-center">
                        {match.schoolB}
                    </div>
                </div>

                <div className="px-1 text-[10px] text-muted-foreground font-mono">VS</div>

                {/* School C */}
                <div className="flex-1">
                    <div className="text-sm md:text-md font-bold font-display text-foreground leading-tight line-clamp-2 h-10 flex items-center justify-center">
                        {match.schoolC}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <OddsButton
                    label={match.isVirtual ? "1" : match.schoolA}
                    odds={match.odds.schoolA}
                    matchId={match.id}
                    matchLabel={matchLabel}
                    marketName="Match Winner"
                    showLabel={match.isVirtual}
                    onClick={onOddsClick}
                    isSelected={checkSelected?.(`${match.id}-Match Winner-${match.isVirtual ? "1" : match.schoolA}`)}
                />
                <OddsButton
                    label={match.isVirtual ? "2" : match.schoolB}
                    odds={match.odds.schoolB}
                    matchId={match.id}
                    matchLabel={matchLabel}
                    marketName="Match Winner"
                    showLabel={match.isVirtual}
                    onClick={onOddsClick}
                    isSelected={checkSelected?.(`${match.id}-Match Winner-${match.isVirtual ? "2" : match.schoolB}`)}
                />
                <OddsButton
                    label={match.isVirtual ? "3" : match.schoolC}
                    odds={match.odds.schoolC}
                    matchId={match.id}
                    matchLabel={matchLabel}
                    marketName="Match Winner"
                    showLabel={match.isVirtual}
                    onClick={onOddsClick}
                    isSelected={checkSelected?.(`${match.id}-Match Winner-${match.isVirtual ? "3" : match.schoolC}`)}
                />
            </div>

            <div className="mt-3 text-center">
                <Link href={`/matches/${match.id}`} className="text-xs text-primary hover:text-blue-400 hover:underline transition-colors block w-full py-1">
                    View more markets +
                </Link>
            </div>
        </div>
    )
}
