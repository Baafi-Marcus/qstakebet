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
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
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
            if (isAdminPage && (!isLoggedIn || auth?.user?.role !== "admin")) {
                return Response.redirect(new URL("/", nextUrl.url))
            }

            return true
        },
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
} satisfies NextAuthConfig
