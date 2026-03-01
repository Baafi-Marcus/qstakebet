import React from "react"
import { getAllSchools } from "@/lib/data"
import { VirtualsClient } from "../VirtualsClient"

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
    let profile: { balance: number; bonusBalance?: number; currency: string } = { balance: 0, bonusBalance: 0, currency: "GHS" }
    let userSeed = 0

    if (session?.user) {
        const wallet = await getUserWalletBalance()
        profile = {
            balance: wallet.balance,
            bonusBalance: wallet.bonusBalance,
            currency: "GHS"
        }

        // Simple numeric seed from user ID
        const userId = session.user.id || "0"
        userSeed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    }

    return <VirtualsClient schools={schools} profile={profile} userSeed={userSeed} user={session?.user} />
}
