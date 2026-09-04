import { db } from "@/lib/db"
import { matches } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { getFeaturedMatches } from "@/lib/data"
import { getSemiFinalLeaderboard, getQuarterFinalLeaderboard, getGrandFinalLeaderboard } from "@/lib/fantasy-actions"
import { isPlayoffStage } from "@/lib/playoff-stages"
import { HomeClient } from "@/components/home/HomeClient"
import { SemifinalHome } from "@/components/home/SemifinalHome"
import { GrandFinalHome } from "@/components/home/GrandFinalHome"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [allMatches, featured, semiFinalStandings, quarterFinalStandings, grandFinalStandings] = await Promise.all([
    db.select({
      id: matches.id,
      stage: matches.stage,
      scheduledAt: matches.scheduledAt,
      status: matches.status,
      participants: matches.participants,
      result: matches.result,
      metadata: matches.metadata,
    }).from(matches).orderBy(asc(matches.scheduledAt)),
    getFeaturedMatches(),
    getSemiFinalLeaderboard(),
    getQuarterFinalLeaderboard(),
    getGrandFinalLeaderboard(),
  ])

  const qfMatches = allMatches.filter(m => isPlayoffStage(m.stage, "quarterFinal"))
  const sfMatches = allMatches.filter(m => isPlayoffStage(m.stage, "semiFinal"))
  const gfMatches = allMatches.filter(m => isPlayoffStage(m.stage, "grandFinal"))

  const qfRecap = qfMatches.map(m => {
    const participants = (m.participants as any[]) || []
    const result = (m.result as any) || {}
    const winnerId = result.winner
    const winner = participants.find(p => p.schoolId === winnerId)
    return {
      id: m.id,
      date: m.scheduledAt?.toISOString() ?? null,
      winnerName: winner?.name || "TBD",
      winnerScore: result.scores?.[winnerId] ?? null,
    }
  }).filter(r => r.winnerName !== "TBD")

  const sfContests = sfMatches.map((m, i) => ({
    id: m.id,
    label: (m.metadata as any)?.sfLabel ?? i + 1,
    date: m.scheduledAt?.toISOString() ?? null,
    teams: ((m.participants as any[]) || []).map(p => p.name as string),
  }))

  const semiFinalTop = semiFinalStandings.slice(0, 5).map(s => ({
    username: s.username,
    points: s.points,
  }))

  const quarterFinalTop = quarterFinalStandings.slice(0, 5).map(s => ({
    username: s.username,
    points: s.points,
  }))

  const sfDeadline = sfMatches.find(m => m.scheduledAt)?.scheduledAt?.toISOString() ?? null

  const sfActive = sfMatches.some(m => m.status !== 'finished' && m.status !== 'settled')

  const gfMatch = gfMatches.find(m => m.status !== 'finished' && m.status !== 'settled') || gfMatches[0]

  const gfFinalists = gfMatch
    ? (((gfMatch.participants as any[]) || []).map((p, i) => ({
        id: p.schoolId,
        name: p.name,
        seed: ((gfMatch.metadata as any)?.seedFor?.[p.schoolId]) ?? i + 1,
      })) as { id: string; name: string; seed: number }[])
    : []

  const sfRecap = sfMatches
    .map(m => {
      const participants = (m.participants as any[]) || []
      const result = (m.result as any) || {}
      const winnerId = result.winner
      const winner = participants.find(p => p.schoolId === winnerId)
      return {
        id: m.id,
        winnerName: winner?.name || "TBD",
        winnerScore: result.scores?.[winnerId] ?? null,
      }
    })
    .filter(r => r.winnerName !== "TBD")

  const grandFinalTop = grandFinalStandings.slice(0, 5).map(s => ({
    username: s.username,
    points: s.points,
  }))

  const gfDeadline = gfMatches.find(m => m.scheduledAt)?.scheduledAt?.toISOString() ?? null

  const gfActive = gfMatches.some(m => m.status !== 'finished' && m.status !== 'settled')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        {gfActive ? (
          <GrandFinalHome
            initialMatches={featured}
            gfFinalists={gfFinalists}
            gfDeadline={gfDeadline}
            sfRecap={sfRecap}
            grandFinalTop={grandFinalTop}
            quarterFinalTop={quarterFinalTop}
          />
        ) : sfActive ? (
          <SemifinalHome
            initialMatches={featured}
            sfContests={sfContests}
            sfDeadline={sfDeadline}
            qfRecap={qfRecap}
            semiFinalTop={semiFinalTop}
            quarterFinalTop={quarterFinalTop}
          />
        ) : (
          <HomeClient
            initialMatches={featured}
          />
        )}
      </main>
    </div>
  )
}