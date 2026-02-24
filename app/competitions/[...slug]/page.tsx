import { db } from "@/lib/db"
import { tournaments, matches, schools } from "@/lib/db/schema"
import { eq, sql, inArray, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Trophy, BarChart2, ChevronLeft, CalendarDays, Target, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { TournamentFixturesModal } from "@/components/ui/TournamentFixturesModal"
import { GroupStandingsModal } from "@/components/ui/GroupStandingsModal"
import { OddsButton } from "@/components/ui/OddsButton"
import type { Match } from "@/lib/types"

export const dynamic = 'force-dynamic'

type Props = {
    params: Promise<{ slug: string[] }>
}

const REGION_MAP: Record<string, string> = {
    "ashanti": "Ashanti", "greater-accra": "Greater Accra", "central": "Central",
    "western": "Western", "eastern": "Eastern", "northern": "Northern",
    "upper-east": "Upper East", "upper-west": "Upper West", "volta": "Volta",
    "bono": "Bono", "bono-east": "Bono East", "ahafo": "Ahafo",
    "western-north": "Western North", "oti": "Oti", "savannah": "Savannah",
    "north-east": "North East", "national": "National", "regional": "Regional", "zonal": "Zonal"
}

export default async function CompetitionPage({ params }: Props) {
    const { slug } = await params
    const stage = slug[0]
    const sportFilter = slug[1]?.toLowerCase()

    const regionLabel = REGION_MAP[stage.toLowerCase()] || (stage.charAt(0).toUpperCase() + stage.slice(1))
    const sportLabel = sportFilter ? (sportFilter.charAt(0).toUpperCase() + sportFilter.slice(1)) : null

    const allTournaments = await db.select().from(tournaments).where(eq(tournaments.status, 'active'))
    let stageTournaments = allTournaments.filter(t =>
        t.region?.toLowerCase().replace(/\s+/g, '-') === stage.toLowerCase() ||
        t.region?.toLowerCase() === stage.toLowerCase() ||
        t.name?.toLowerCase().includes(stage.toLowerCase())
    )

    // Apply sport filter if present
    if (sportFilter) {
        stageTournaments = stageTournaments.filter(t =>
            t.sportType?.toLowerCase() === sportFilter
        )
    }

    if (stageTournaments.length === 0 && !REGION_MAP[stage.toLowerCase()]) {
        notFound()
    }

    const tournamentData = await Promise.all(stageTournaments.map(async tournament => {
        const matchData = await db.select().from(matches).where(eq(matches.tournamentId, tournament.id))

        // Fetch schools from group assignments OR matches
        const metadata = (tournament.metadata as any) || {}
        const groupAssignments = metadata.groupAssignments || {}
        const assignedIds = Object.keys(groupAssignments)

        const matchIds = Array.from(new Set(matchData.flatMap(m => (m.participants as any[]).map((p: any) => p.schoolId))))
        const allRelevantIds = Array.from(new Set([...assignedIds, ...matchIds]))

        const schoolData = allRelevantIds.length > 0
            ? await db.select({ id: schools.id, name: schools.name }).from(schools)
                .where(inArray(schools.id, allRelevantIds))
            : []

        return { tournament, matches: matchData as unknown as Match[], schools: schoolData }
    }))

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/tournaments" className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                            <Trophy className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                                {regionLabel} {sportLabel && <span className="text-purple-400">{sportLabel}</span>} Competitions
                            </h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Live Standings & Fixtures</p>
                        </div>
                    </div>
                </div>

                {tournamentData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-4">
                        <BarChart2 className="h-12 w-12 text-slate-700" />
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                            No active {sportLabel ? sportLabel.toLowerCase() : ''} tournaments in this region yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {tournamentData.map(({ tournament, matches: tMatches, schools: tSchools }) => {
                            const metadata = tournament.metadata as any || {}
                            const groups: string[] = metadata.groups || []
                            const groupAssignments: Record<string, string> = metadata.groupAssignments || {}

                            const upcomingMatches = tMatches.filter(m => m.status === 'upcoming' || m.status === 'live')

                            // Detect if Group Rounds are over
                            const groupMatches = tMatches.filter(m => m.group && m.group !== 'Knockout')
                            const allGroupsFinished = groupMatches.length > 0 && groupMatches.every(m => m.status === 'finished' || m.status === 'settled')

                            return (
                                <div key={tournament.id} className="space-y-4">
                                    {/* Tournament Header */}
                                    <div className="flex items-center justify-between gap-4 p-5 bg-slate-900/60 border border-white/5 rounded-[2rem]">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                                {tournament.sportType} · {tournament.gender} · {tournament.year}
                                            </span>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight">{tournament.name}</h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {allGroupsFinished && (
                                                <GroupStandingsModal
                                                    tournamentName={tournament.name}
                                                    matches={tMatches}
                                                    groups={groups}
                                                    groupAssignments={groupAssignments}
                                                    allSchools={tSchools}
                                                />
                                            )}
                                            <TournamentFixturesModal
                                                tournamentName={tournament.name}
                                                tournamentId={tournament.id}
                                                matches={tMatches}
                                            />
                                        </div>
                                    </div>

                                    {/* Tournament Winner Prediction (Outright) */}
                                    {tournament.isOutrightEnabled && tournament.outrightOdds && tournament.outrightOdds.length > 0 && !tournament.winnerId && (
                                        <div className="bg-slate-900/60 border border-purple-500/20 rounded-[2rem] p-6 space-y-4 shadow-lg shadow-purple-900/10 overflow-hidden relative group">
                                            {/* Decorative Background */}
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Target className="h-24 w-24 text-purple-500" />
                                            </div>

                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                                        <Trophy className="h-4 w-4 text-purple-400" />
                                                        Tournament Winner
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Predict the overall champion</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Singles Only</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 relative z-10">
                                                {tournament.outrightOdds
                                                    .sort((a, b) => a.odd - b.odd)
                                                    .map(item => {
                                                        const school = tSchools.find(s => s.id === item.schoolId);
                                                        if (!school) return null;
                                                        return (
                                                            <OddsButton
                                                                key={item.schoolId}
                                                                label={school.name}
                                                                odds={item.odd}
                                                                matchId={`outright-${tournament.id}`} // Dummy ID for matching in slip logic if needed
                                                                tournamentId={tournament.id}
                                                                matchLabel={`${tournament.name} (${tournament.sportType})`}
                                                                marketName="Tournament Winner"
                                                                showLabel={true}
                                                            />
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Group Standings OR Qualified Teams */}
                                    {(groups.length > 0 && !allGroupsFinished) ? (
                                        <div className="space-y-4">
                                            {groups.map(group => {
                                                const gFinished = tMatches.filter(m => m.group === group && (m.status === 'finished' || m.status === 'settled'))
                                                const rows: Record<string, any> = {}

                                                gFinished.forEach(m => {
                                                    if (m.participants.length < 2) return
                                                    const [p1, p2] = m.participants
                                                    const s1 = typeof p1.result === 'number' ? p1.result : parseInt(String(p1.result || "0")) || 0
                                                    const s2 = typeof p2.result === 'number' ? p2.result : parseInt(String(p2.result || "0")) || 0
                                                        ;[p1, p2].forEach(p => { if (!rows[p.schoolId]) rows[p.schoolId] = { id: p.schoolId, name: p.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 } })
                                                    const r1 = rows[p1.schoolId], r2 = rows[p2.schoolId]
                                                    r1.p++; r2.p++; r1.gf += s1; r1.ga += s2; r2.gf += s2; r2.ga += s1
                                                    if (s1 > s2) { r1.w++; r1.pts += 3; r2.l++ }
                                                    else if (s2 > s1) { r2.w++; r2.pts += 3; r1.l++ }
                                                    else { r1.d++; r1.pts++; r2.d++; r2.pts++ }
                                                })

                                                tSchools.filter(s => groupAssignments[s.id] === group).forEach(s => {
                                                    if (!rows[s.id]) rows[s.id] = { id: s.id, name: s.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }
                                                })

                                                const sorted = Object.values(rows).sort((a: any, b: any) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga))
                                                if (sorted.length === 0) return null

                                                return (
                                                    <div key={group} className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden">
                                                        <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                                            <span className="text-sm font-black text-white uppercase">{group}</span>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Group Stage</span>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-white/5 text-slate-500 text-[10px]">
                                                                        <th className="text-left px-5 py-2 font-black">#</th>
                                                                        <th className="text-left px-0 pr-4 py-2 font-black">Team</th>
                                                                        {["P", "W", "D", "L", "GD"].map(h => <th key={h} className="text-center px-2 py-2 font-black">{h}</th>)}
                                                                        <th className="text-center px-2 py-2 font-black text-purple-400">Pts</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sorted.map((s: any, idx: number) => (
                                                                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                                            <td className="px-5 py-3">
                                                                                <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md text-[9px] font-black ${idx < 2 ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>{idx + 1}</span>
                                                                            </td>
                                                                            <td className="py-3 pr-4 font-bold text-white uppercase">{s.name}</td>
                                                                            {[s.p, s.w, s.d, s.l, s.gf - s.ga > 0 ? `+${s.gf - s.ga}` : s.gf - s.ga].map((v, i) => (
                                                                                <td key={i} className="text-center px-2 py-3 text-slate-400 font-bold">{v}</td>
                                                                            ))}
                                                                            <td className="text-center px-2 py-3 font-black text-purple-400">{s.pts}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        // Knockout Qualified Teams Display OR Progress
                                        (() => {
                                            const finishedKnockouts = tMatches.filter(m => m.status === 'finished' || m.status === 'settled')

                                            // Determine latest finished stage
                                            const stages = Array.from(new Set(finishedKnockouts.map(m => m.stage || "Tournament"))).reverse()

                                            // Fallback for when group stage just ended but no knockouts exist yet
                                            const latestStage = stages.length > 0 ? stages[0] : "Group Stage"
                                            const latestMatches = stages.length > 0 ? finishedKnockouts.filter(m => (m.stage || "Tournament") === latestStage) : groupMatches

                                            // Collect winners
                                            const winners = latestMatches.reduce((acc: Array<{ id: string, name: string }>, m) => {
                                                const res = m.result as any
                                                if (res?.winner) {
                                                    const winner = m.participants.find(p => p.schoolId === res.winner)
                                                    if (winner) acc.push({ id: winner.schoolId, name: winner.name })
                                                }
                                                return acc
                                            }, [])

                                            if (winners.length === 0 && !allGroupsFinished) return null

                                            return (
                                                <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 space-y-4">
                                                    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Tournament Progress</p>
                                                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Teams Through to Next Round</h3>
                                                        </div>
                                                        <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                                                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">{latestStage} Winners</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {winners.map(w => (
                                                            <div key={w.id} className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-2xl">
                                                                <div className="p-1.5 rounded-lg bg-green-500/10">
                                                                    <Trophy className="h-3 w-3 text-green-400" />
                                                                </div>
                                                                <span className="text-xs font-bold text-white uppercase truncate">{w.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic pt-2">
                                                        Waiting for the admin to schedule the next round of fixtures...
                                                    </p>
                                                </div>
                                            )
                                        })()
                                    )}

                                    {/* Upcoming Fixtures with Bet Buttons */}
                                    {upcomingMatches.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Upcoming Fixtures</p>
                                            {upcomingMatches.map(m => {
                                                const matchLabel = m.participants.map(p => p.name).join(' vs ')
                                                return (
                                                    <div key={m.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3">
                                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                            <span>{m.group || m.stage}</span>
                                                            <span className={m.status === 'live' ? 'text-red-400 animate-pulse' : ''}>{m.status === 'live' ? '🔴 LIVE' : m.startTime || 'TBD'}</span>
                                                        </div>
                                                        <div className={`grid gap-2 ${m.participants.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                                            {m.participants.map(p => (
                                                                <OddsButton key={p.schoolId} label={p.name} odds={p.odd} matchId={m.id} matchLabel={matchLabel} marketName="Match Winner" showLabel={true} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
