import React from "react"
import { getAllSchools } from "@/lib/data"
import { VirtualsClient } from "./VirtualsClient"

export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { getUserWalletBalance } from "@/lib/wallet-actions"

export default async function VirtualsPage() {
    // Fetch all schools on the server
    const schoolsData = await getAllSchools()
    const schools = schoolsData.map(s => ({
        name: s.name,
        region: s.region
    }))

    const session = await auth()
    let profile = { balance: 0, currency: "GHS" }

    if (session?.user) {
        const wallet = await getUserWalletBalance()
        profile = { balance: wallet.balance, currency: "GHS" }
    }

    return <VirtualsClient schools={schools} profile={profile} />
}
