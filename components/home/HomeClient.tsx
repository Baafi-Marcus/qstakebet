"use client"

import { useState, useMemo, useEffect } from "react"
import { Trophy, Search, Filter, Calendar } from "lucide-react"
import { Match } from "@/lib/types"
import { MatchRow } from "@/components/ui/MatchRow"
import { SplashScreen } from "@/components/ui/SplashScreen"
import { MatchDetailsModal } from "@/components/ui/MatchDetailsModal"
import { useBetSlip } from "@/lib/store/useBetSlip"
import { cn } from "@/lib/utils"

interface HomeClientProps {
    initialMatches: Match[]
}

// Helper to get ordinal suffix
function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

// Helper to get date group label
function getDateGroupLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchDate = new Date(date);
    matchDate.setHours(0, 0, 0, 0);

    const isToday = matchDate.getTime() === today.getTime();

    const day = matchDate.getDate();
    const month = matchDate.toLocaleDateString('en-GB', { month: 'short' });
    const year = matchDate.getFullYear();
    const formattedDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;

    if (isToday) {
        return `Today ${formattedDate}`;
    } else {
        const weekday = matchDate.toLocaleDateString('en-GB', { weekday: 'short' });
        return `${weekday} ${formattedDate}`;
    }
}

export function HomeClient({ initialMatches }: HomeClientProps) {
    const [activeMarket, setActiveMarket] = useState<'winner' | 'total_points'>('winner')
    const [activeLevel, setActiveLevel] = useState<'shs' | 'university'>('shs')
    const [activeDateTab, setActiveDateTab] = useState<'today' | 'tomorrow' | 'upcoming' | 'all'>('today')
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<Match | null>(null)
    const { addSelection, selections } = useBetSlip()

    const filteredMatches = initialMatches.filter(m => {
        const matchesLevel = m.level === activeLevel
        const matchesSearch = m.stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

        // Date Tabs Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const afterTomorrow = new Date(tomorrow);
        afterTomorrow.setDate(tomorrow.getDate() + 1);

        const matchDate = m.scheduledAt ? new Date(m.scheduledAt) : null;
        if (matchDate) {
            matchDate.setHours(0, 0, 0, 0);
        }

        let dateMatch = false;
        if (activeDateTab === 'today') {
            dateMatch = !matchDate || matchDate.getTime() === today.getTime() || m.isLive;
        } else if (activeDateTab === 'tomorrow') {
            dateMatch = matchDate?.getTime() === tomorrow.getTime();
        } else if (activeDateTab === 'upcoming') {
            dateMatch = matchDate ? matchDate.getTime() >= afterTomorrow.getTime() : false;
        } else if (activeDateTab === 'all') {
            dateMatch = true;
        }

        return matchesLevel && matchesSearch && dateMatch
    })

    // Group matches by date
    const groupedMatches = useMemo(() => {
        const groups: { [key: string]: Match[] } = {};

        filteredMatches.forEach(match => {
            let groupKey = "Live & Recent";

            if (match.scheduledAt) {
                const schedDate = new Date(match.scheduledAt);
                groupKey = getDateGroupLabel(schedDate);
            } else if (match.isLive) {
                groupKey = "Live & Recent";
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(match);
        });

        // Sort groups by date priority
        const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
            const priority: { [key: string]: number } = {
                "Live & Recent": 0,
                "Today": 1,
                "Tomorrow": 2
            };

            const aPriority = priority[a] ?? 3;
            const bPriority = priority[b] ?? 3;

            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }

            // For other dates, sort chronologically
            return a.localeCompare(b);
        });

        return sortedGroupKeys.map(key => ({
            label: key,
            matches: groups[key]
        }));
    }, [filteredMatches]);

    // Check if a selection is in the bet slip
    const checkSelected = (selectionId: string) => {
        return selections.some(s => s.selectionId === selectionId)
    }

    const availableMarkets = useMemo(() => {
        const markets = new Set<string>();
        markets.add('winner');
        markets.add('total_points');
        filteredMatches.forEach(m => {
            if (m.extendedOdds) {
                Object.keys(m.extendedOdds).forEach(k => {
                    // Map common keys to friendly IDs
                    if (k === 'winningMargin') markets.add('winning_margin');
                    else if (k === 'highestScoringRound') markets.add('highest_scoring_round');
                    else if (k === 'roundWinner') markets.add('round_winner');
                    else if (k === 'perfectRound') markets.add('perfect_round');
                    else if (k === 'shutoutRound') markets.add('shutout_round');
                    else if (k === 'comebackWin') markets.add('comeback_win');
                    else if (k === 'leadChanges') markets.add('lead_changes');
                    else markets.add(k);
                });
            }
        });
        return Array.from(markets).map(m => ({
            id: m,
            label: m === 'winner' ? 'Match Winner' :
                m === 'total_points' ? 'Total Points' :
                    m.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
        }));
    }, [filteredMatches]);

    // Reset active market if not available in current filtered matches
    useEffect(() => {
        if (availableMarkets.length > 0 && !availableMarkets.find(m => m.id === activeMarket)) {
            setActiveMarket('winner');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableMarkets]);

    return (
        <div className="max-w-[1400px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-6 sm:space-y-10">
            {/* Level Switcher */}
            <div className="flex justify-center mb-2">
                <div className="flex p-1 bg-slate-950/50 border border-white/5 rounded-2xl">
                    {[
                        { id: 'shs', label: 'SHS Games' },
                        { id: 'university', label: 'University' }
                    ].map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setActiveLevel(level.id as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeLevel === level.id
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Tabs */}
            <div className="flex justify-center -mt-4">
                <div className="flex gap-2 p-1 bg-slate-900/40 border border-white/5 rounded-xl">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'tomorrow', label: 'Tomorrow' },
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'all', label: 'All' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveDateTab(tab.id as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                activeDateTab === tab.id
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-400"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>


            {/* Market Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex bg-slate-950/80 border border-white/5 overflow-x-auto no-scrollbar py-2 px-4 -mx-4 md:-mx-8 w-full md:w-auto rounded-xl md:rounded-full">
                    <div className="flex items-center gap-3 min-w-max">
                        {availableMarkets.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setActiveMarket(m.id as any)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] transition-all border whitespace-nowrap",
                                    activeMarket === m.id
                                        ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/20"
                                        : "bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {m.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Matches List - Grouped by Date */}
            <div className="space-y-6 sm:space-y-8">
                {groupedMatches.length > 0 ? (
                    groupedMatches.map((group) => (
                        <div key={group.label} className="space-y-3 sm:space-y-4">
                            {/* Date Header */}
                            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                <h2 className="text-sm sm:text-xl font-black text-white uppercase tracking-tight">
                                    {group.label}
                                </h2>
                                <div className="flex-1 h-px bg-white/5" />
                                <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {group.matches.length} {group.matches.length === 1 ? 'Match' : 'Matches'}
                                </span>
                            </div>

                            {/* Matches in this group */}
                            <div className="bg-slate-900/20 border border-white/5 rounded-2xl sm:rounded-[2.5rem] overflow-hidden divide-y divide-white/5">
                                {group.matches.map((match) => (
                                    <MatchRow
                                        key={match.id}
                                        match={match}
                                        activeMarket={activeMarket}
                                        onOddsClick={addSelection}
                                        checkSelected={checkSelected}
                                        onMoreClick={(m) => setSelectedMatchForDetails(m)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-20 text-center space-y-4 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Trophy className="h-8 w-8 text-slate-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white font-bold">No matches found</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Adjust your filters or search</p>
                        </div>
                    </div>
                )}
            </div>

            {selectedMatchForDetails && (
                <MatchDetailsModal
                    match={selectedMatchForDetails}
                    onClose={() => setSelectedMatchForDetails(null)}
                    onOddsClick={addSelection}
                    checkSelected={checkSelected}
                />
            )}
        </div>
    )
}
