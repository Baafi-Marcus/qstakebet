import { getSetting } from "@/lib/settings-actions"
import { auth } from "@/lib/auth"
import { Construction } from "lucide-react"

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const maintenanceMode = await getSetting("maintenance_mode", false)
    const session = await auth()
    const isAdmin = session?.user?.role === "admin"

    if (maintenanceMode && !isAdmin) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-6 overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 text-center max-w-md w-full">
                    <div className="mb-8 flex justify-center">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-2xl animate-pulse">
                            <Construction className="h-16 w-16 text-purple-400" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
                        Systems Under <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            Maintenance
                        </span>
                    </h1>

                    <p className="text-slate-400 font-medium leading-relaxed mb-8">
                        We&apos;re currently performing scheduled updates to improve your betting experience. We&apos;ll be back shortly!
                    </p>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Estimated uptime: Check back in 30 minutes
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
