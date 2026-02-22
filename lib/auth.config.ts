import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.phone = (user as any).phone
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.phone = token.phone as string
            }
            return session
        },
        authorized({ auth, request: nextUrl }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.nextUrl.pathname.startsWith("/auth")
            const isAccountPage = nextUrl.nextUrl.pathname.startsWith("/account")
            const isAdminPage = nextUrl.nextUrl.pathname.startsWith("/admin")

            // Redirect logged-in users away from auth pages
            if (isAuthPage && isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl.url))
            }

            // Protect account pages
            if (isAccountPage && !isLoggedIn) {
                return false // Redirect to login
            }

            // Protect admin pages (require admin role)
            // Allow access to /admin/login for all
            if (isAdminPage && nextUrl.nextUrl.pathname !== "/admin/login") {
                if (!isLoggedIn || auth?.user?.role !== "admin") {
                    return Response.redirect(new URL("/admin/login", nextUrl.url))
                }
            }

            return true
        },
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
} satisfies NextAuthConfig
