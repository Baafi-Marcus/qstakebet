import { getAdminAnalytics } from "@/lib/admin-analytics-actions"
import { AnalyticsClient } from "./AnalyticsClient"

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
    const data = await getAdminAnalytics()

    if (!data.success) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                <p className="text-red-400 font-bold">{data.error || "Failed to load analytics"}</p>
            </div>
        )
    }

    return (
        <AnalyticsClient data={data} />
    )
}
