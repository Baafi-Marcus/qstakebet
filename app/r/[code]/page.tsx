import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { trackLinkClick } from "@/lib/referral-actions"

export default async function ReferralRedirectPage({
    params,
}: {
    params: Promise<{ code: string }>
}) {
    const { code } = await params
    const headersList = await headers()

    // Extract IP and User-Agent for tracking
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Track the click (Server Action)
    // We don't await this to avoid blocking the redirect, 
    // but Next.js might complain about unhandled promises in edge cases.
    // For now, let's await it since it's a fast DB write.
    await trackLinkClick(code, ip, userAgent)

    // Redirect to registration with the referral code pre-filled
    redirect(`/register?ref=${code}`)
}
