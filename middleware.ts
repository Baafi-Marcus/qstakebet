import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isAccountPage = req.nextUrl.pathname.startsWith("/account")
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin")

    // Redirect logged-in users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    // Protect account pages
    if (isAccountPage && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Protect admin pages (require admin role)
    if (isAdminPage && (!isLoggedIn || req.auth?.user?.role !== "admin")) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*"]
}
