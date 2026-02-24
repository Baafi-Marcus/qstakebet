import { getFeaturedMatches } from "@/lib/data"
import { HomeClient } from "@/components/home/HomeClient"
import { getActiveAnnouncements } from "@/lib/announcement-actions"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [matches, announcements] = await Promise.all([
    getFeaturedMatches(),
    getActiveAnnouncements()
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        <HomeClient initialMatches={matches} announcements={announcements} />
      </main>
    </div>
  )
}
