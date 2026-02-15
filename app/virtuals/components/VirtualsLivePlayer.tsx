import React from "react"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { VirtualMatchOutcome, simulateMatch, VirtualSchool } from "@/lib/virtuals"
import { Match } from "@/lib/types"

interface VirtualsLivePlayerProps {
    match: Match;
    schools: VirtualSchool[];
    aiStrengths: Record<string, number>;
    userSeed: number;
    simulationProgress: number;
    currentCommentary: string;
    countdown: string | null;
    onClose: () => void;
    onSkip: () => void;
    isSimulating: boolean;
}

export function VirtualsLivePlayer({
    match,
    schools,
    aiStrengths,
    userSeed,
    simulationProgress,
    currentCommentary,
    countdown,
    onClose,
    onSkip,
    isSimulating
}: VirtualsLivePlayerProps) {
    const stage = match.id.split("-")[3] as 'regional' | 'national';
    const regionSlug = match.id.split("-")[4] || 'all';
    const regionName = schools.find(s => s.region.toLowerCase().replace(/\s+/g, '-') === regionSlug)?.region;

    const outcome = simulateMatch(
        parseInt(match.id.split("-")[1]),
        parseInt(match.id.split("-")[2]),
        schools,
        stage,
        regionName,
        aiStrengths,
        userSeed
    );

    const currentRoundIdx = Math.min(4, Math.floor((simulationProgress / 60) * 5));
    const displayScores = outcome.rounds[currentRoundIdx]?.scores || [0, 0, 0];
    const isFullTime = simulationProgress >= 60;

    return (
        <div className="shrink-0 bg-slate-950 border-b border-white/10 relative z-30">
            {/* Countdown Overlay */}
            {countdown && (
                <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-8 shadow-2xl shadow-red-600/20">
                            Prepare to win
                        </div>
                        <div className={cn(
                            "text-8xl md:text-[10rem] font-black italic tracking-tighter transition-all duration-300",
                            countdown === 'START' ? "text-emerald-400 scale-110 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]" : "text-white"
                        )}>
                            {countdown}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-emerald-950/80 overflow-hidden h-[200px] flex flex-col">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-x-8 inset-y-8 border-2 border-white/20 rounded-lg" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full" />
                </div>

                <div className="relative z-10 p-4 flex flex-col items-center justify-center flex-1">
                    <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">{match.stage} • Matchday {parseInt(match.id.split("-")[1])}</span>
                        </div>
                        <div className="px-2 py-0.5 bg-white/10 rounded text-[8px] font-black text-white/40 uppercase tracking-widest">
                            Round {currentRoundIdx + 1}
                        </div>
                    </div>

                    {/* Live Commentary Ticker */}
                    <div className="w-full max-w-lg mb-4 h-6 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-emerald-950/80 z-10" />
                        <div className="flex items-center justify-center h-full">
                            <span key={currentCommentary} className="text-[10px] font-bold text-emerald-400/90 italic tracking-wide animate-in slide-in-from-bottom-2 duration-300">
                                {currentCommentary}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 bg-black/20 hover:bg-black/40 text-white/50 hover:text-white rounded-full transition-colors z-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-4 md:gap-10 w-full max-w-xl justify-center mb-4 px-4 overflow-x-auto no-scrollbar">
                    {outcome.schools.map((school: string, sIdx: number) => (
                        <React.Fragment key={sIdx}>
                            <div className="flex flex-col items-center gap-2 flex-1 min-w-[60px]">
                                <div className="text-4xl md:text-5xl font-black italic text-white drop-shadow-lg tabular-nums">
                                    {displayScores[sIdx]}
                                </div>
                                <span className="text-[9px] md:text-[10px] font-black uppercase text-emerald-400 tracking-widest text-center truncate w-full max-w-[100px]">{school}</span>
                            </div>
                            {sIdx < outcome.schools.length - 1 && <div className="text-white/20 font-black italic text-[10px] mb-6 px-2">VS</div>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="w-full max-w-xs grid grid-cols-5 gap-1 mx-auto mb-2">
                    {outcome.rounds.slice(0, 5).map((r, rIdx) => (
                        <div key={rIdx} className={cn(
                            "flex flex-col items-center p-1 rounded border transition-all duration-300",
                            rIdx === currentRoundIdx ? "bg-white/20 border-white/40 scale-110 shadow-lg" :
                                "bg-black/20 border-white/5 opacity-10"
                        )}>
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className={cn("h-full", rIdx === currentRoundIdx ? "bg-emerald-400 w-full" : "w-0")} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skip Button - Compact inside player */}
            {isSimulating && simulationProgress < 60 && (
                <button
                    onClick={onSkip}
                    className="absolute bottom-4 right-4 bg-black/40 hover:bg-white text-white hover:text-black border border-white/10 hover:border-white px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
                >
                    Skip
                </button>
            )}
        </div>
    );
}
