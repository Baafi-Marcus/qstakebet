import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
    matcher: ["/account/:path*", "/admin/:path*", "/auth/:path*"]
}
