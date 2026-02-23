import { getFeaturedMatches } from "@/lib/data"
import { HomeClient } from "@/components/home/HomeClient"
import { SplashScreen } from "@/components/ui/SplashScreen"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const matches = await getFeaturedMatches()

  return (
    <SplashScreen>
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 pb-20">
          <HomeClient initialMatches={matches} />
        </main>
      </div >
    </SplashScreen>
  )
}
