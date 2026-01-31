
import { notFound } from "next/navigation"
import { Trophy } from "lucide-react"

type Props = {
    params: Promise<{ sport: string }>
}

export const dynamic = 'force-dynamic'

const VALID_SPORTS = ["football", "basketball", "athletics", "volleyball", "handball", "quiz"]

export default async function SportPage({ params }: Props) {
    const { sport } = await params

    if (!VALID_SPORTS.includes(sport.toLowerCase())) {
        notFound()
    }

    const title = sport.charAt(0).toUpperCase() + sport.slice(1)

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold font-display text-foreground mb-2">{title}</h1>
                    <p className="text-muted-foreground">Bet on the latest {title.toLowerCase()} matches.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-6 animate-in fade-in duration-700">
                    <div className="inline-flex p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <Trophy className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Matches Coming Soon</p>
                    </div>
                    <p className="max-w-xs mx-auto text-slate-400 text-sm font-medium">
                        We are currently setting up the leagues for {title.toLowerCase()}. Check back shortly for live odds and fixtures!
                    </p>
                </div>
            </main>
        </div>
    )
}
