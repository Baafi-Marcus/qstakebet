import { getSetting } from "@/lib/settings-actions"
import { auth } from "@/lib/auth"
import { Construction } from "lucide-react"
import { headers } from "next/headers";

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const maintenanceMode = await getSetting("maintenance_mode", false);
    const allowedPath = await getSetting("maintenance_allowed_path", "");
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    // Get current pathname from middleware-injected header
    const headersList = await headers();
    const currentPath = headersList.get('x-pathname') || "/";

    // Admins always bypass maintenance
    if (isAdmin) {
        return <>{children}</>;
    }

    // Check if on allowed path (e.g. /virtuals)
    const isOnAllowedPath = allowedPath && (currentPath === allowedPath || currentPath.startsWith(`${allowedPath}/`));

    if (maintenanceMode && !isOnAllowedPath) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#05070a] p-6 overflow-hidden select-none">
                {/* Immersive background effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[160px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[160px] animate-pulse delay-700" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                </div>

                <div className="relative z-10 text-center max-w-xl w-full px-4">
                    <div className="mb-12 flex justify-center perspective-1000">
                        <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative group transition-transform duration-700 hover:rotate-y-12">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-[2.5rem]" />
                            <Construction className="h-16 w-16 text-purple-400 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />

                            {/* Orbiting sparkles */}
                            <div className="absolute -top-2 -right-2 p-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,1)] animate-bounce" />
                            <div className="absolute -bottom-1 -left-1 p-1 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse" />
                        </div>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.9]">
                        System<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                            Refinement
                        </span>
                    </h1>

                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12 max-w-md mx-auto opacity-80">
                        We&apos;re currently deploying mission-critical updates to elevate your betting experience.
                    </p>

                    <div className="flex flex-col items-center gap-6">
                        {allowedPath && (
                            <a
                                href={allowedPath}
                                className="px-10 py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.6)] hover:-translate-y-1 transition-all active:scale-95 border-t border-white/20"
                            >
                                Access {allowedPath.replace('/', '').toUpperCase() || "Available Areas"}
                            </a>
                        )}

                        <div className="px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-inner flex items-center gap-3 group transition-all hover:bg-white/[0.05]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">
                                Expected Uptime: <span className="text-white">~30 Minutes</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Corner decorative elements */}
                <div className="absolute top-12 left-12 w-24 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                <div className="absolute top-12 left-12 w-[1px] h-24 bg-gradient-to-b from-white/10 to-transparent" />
                <div className="absolute bottom-12 right-12 w-24 h-[1px] bg-gradient-to-l from-white/10 to-transparent" />
                <div className="absolute bottom-12 right-12 w-[1px] h-24 bg-gradient-to-t from-white/10 to-transparent" />
            </div>
        )
    }

    return <>{children}</>
}
