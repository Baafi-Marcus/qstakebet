import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Star } from "lucide-react";
import { GiftWrapper } from "@/components/ui/GiftWrapper";

export const dynamic = 'force-dynamic'

export default async function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <GiftWrapper />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Featured Matches</h1>
            <p className="text-muted-foreground">Top academic clashes happening today.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-white/5 rounded-[2.5rem] text-center space-y-6 animate-in fade-in duration-700">
            <div className="inline-flex p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20">
              <Star className="h-10 w-10 text-purple-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Real-time Battles</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Coming Soon to QSTAKE</p>
            </div>
            <p className="max-w-xs mx-auto text-slate-400 text-sm font-medium">
              We&apos;re preparing the most exciting featured matches for you. In the meantime, try our Instant Virtuals!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
