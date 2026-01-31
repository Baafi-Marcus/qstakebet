import React from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OddsButton } from "@/components/ui/OddsButton";
import { getMatchById } from "@/lib/data";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

type Props = {
    params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function MatchDetailPage({ params }: Props) {
    const { id } = await params

    const match = await getMatchById(id)

    if (!match) {
        notFound()
    }

    const matchLabel = match.participants.map(p => p.name).join(' vs ')

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-0 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                    {/* Mobile Back Header */}
                    <div className="md:hidden flex items-center p-4 border-b border-border bg-card sticky top-14 z-40">
                        <Link href="/" className="mr-4">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Link>
                        <span className="font-semibold text-sm line-clamp-1">{match.stage}</span>
                    </div>

                    <div className="bg-card md:rounded-xl overflow-hidden border-b md:border border-border">
                        {/* Match Header */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Trophy className="h-32 w-32 text-accent" />
                            </div>

                            <div className="flex justify-center items-center gap-2 mb-4 text-accent text-xs font-bold uppercase tracking-widest">
                                <Trophy className="h-4 w-4" />
                                <span>{match.stage}</span>
                            </div>

                            <div className="flex items-center justify-center flex-wrap gap-4 max-w-3xl mx-auto mb-6">
                                {match.participants.map((p, idx) => (
                                    <React.Fragment key={p.schoolId}>
                                        <div className="flex-1 min-w-[120px] text-center">
                                            <h2 className="text-xl md:text-2xl font-bold font-display text-white mb-1 uppercase tracking-tight">{p.name}</h2>
                                        </div>
                                        {idx < match.participants.length - 1 && (
                                            <div className="text-slate-500 font-mono text-[10px] uppercase font-bold px-2">VS</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="inline-flex items-center bg-black/30 rounded-full px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-sm border border-white/5">
                                <Clock className="h-3 w-3 mr-2" />
                                {match.isLive ? <span className="text-red-500 font-bold animate-pulse mr-2">LIVE NOW</span> : match.startTime}
                                <span className="mx-2">•</span>
                                <MapPin className="h-3 w-3 mr-2" />
                                <span>{match.isVirtual ? 'Virtual Arena (Simulated)' : 'SGS Auditorium, UCC'}</span>
                            </div>
                        </div>

                        {/* Tabs / Stats */}
                        <div className="flex border-b border-border bg-secondary/20">
                            <button className="flex-1 py-4 text-sm font-medium text-primary border-b-2 border-primary">Markets</button>
                            <button className="flex-1 py-4 text-sm font-medium text-muted-foreground hover:text-foreground">Stats (H2H)</button>
                            <button className="flex-1 py-4 text-sm font-medium text-muted-foreground hover:text-foreground">Lineups</button>
                        </div>

                        {/* Markets Content */}
                        <div className="p-4 md:p-6 space-y-6">
                            {/* Main Market */}
                            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 backdrop-blur-md">
                                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                                    <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                                    Match Winner
                                </h3>
                                <div className={`grid gap-3 ${match.participants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                    {match.participants.map((p) => (
                                        <OddsButton
                                            key={p.schoolId}
                                            label={p.name}
                                            odds={p.odd}
                                            matchId={match.id}
                                            matchLabel={matchLabel}
                                            marketName="Match Winner"
                                            showLabel={true}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Extended Markets */}
                            {match.extendedOdds && Object.entries(match.extendedOdds).map(([marketName, options]) => (
                                <div key={marketName} className="bg-secondary/10 rounded-lg p-4 border border-border">
                                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center capitalize">
                                        <div className="w-1 h-4 bg-accent mr-2 rounded-full"></div>
                                        {marketName.replace(/([A-Z])/g, ' $1').trim()}
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(options as Record<string, number>).map(([label, odds]) => (
                                            <OddsButton
                                                key={label}
                                                label={label}
                                                odds={odds}
                                                matchId={match.id}
                                                matchLabel={matchLabel}
                                                marketName={marketName.replace(/([A-Z])/g, ' $1').trim()}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
