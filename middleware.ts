import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const url = new URL(req.nextUrl)
    const requestHeaders = new Headers(req.headers)

    // Inject pathname for Server Components (MaintenanceGuard)
    requestHeaders.set('x-pathname', url.pathname)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
})

export const config = {
    // Matcher should include all routes except static files
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
