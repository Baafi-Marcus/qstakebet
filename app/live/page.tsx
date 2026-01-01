import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Timer } from "lucide-react";

export default function LivePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8">
                    <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
                            <Timer className="h-12 w-12 text-purple-400 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase sm:text-5xl">
                                Live Matches
                            </h1>
                            <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">
                                Real-time coverage is coming soon
                            </p>
                        </div>
                        <div className="max-w-xs mx-auto text-slate-400 text-sm font-medium">
                            We&apos;re working on bringing you the most immersive live-betting experience for academic competitions. Stay tuned!
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
