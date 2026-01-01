import Link from "next/link"
import { Wallet, Menu, User } from "lucide-react"

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="container flex h-14 items-center px-4 md:px-6">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-display font-bold text-xl text-primary sm:inline-block">
                            QSTAKE<span className="text-foreground">bet</span>
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                            Sports
                        </Link>
                        <Link href="/live" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                            Live
                        </Link>
                        <Link href="/virtuals" className="transition-colors hover:text-foreground/80 text-accent font-bold relative group">
                            Virtuals
                            <span className="absolute -top-2 -right-4 bg-red-500 text-[8px] text-white px-1 rounded animate-pulse">NEW</span>
                        </Link>
                    </nav>
                </div>

                {/* Mobile Menu Button - Placeholder */}
                <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 py-2 w-9 px-0 md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </button>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <div className="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1 border border-slate-700">
                        <Wallet className="h-4 w-4 text-accent" />
                        <span className="text-sm font-mono font-medium text-foreground">GHS 500.00</span>
                    </div>
                    <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white ring-2 ring-primary/20">
                        <User className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    )
}
