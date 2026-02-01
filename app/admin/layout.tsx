import { Header } from "@/components/layout/Header"
import Link from "next/link"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex flex-1">
                <aside className="hidden border-r border-border bg-card/40 lg:block w-64 h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto py-6 px-4">
                    <div className="space-y-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                                Admin Console
                            </h2>
                            <div className="space-y-1">
                                <Link href="/admin" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    Dashboard
                                </Link>
                                <Link href="/admin/tournaments" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    Tournaments
                                </Link>
                                <Link href="/admin/schools" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    Schools
                                </Link>
                                <Link href="/admin/matches" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    Manage Matches
                                </Link>
                                <Link href="/admin/users" className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                                    User Management
                                </Link>
                            </div>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    )
}
