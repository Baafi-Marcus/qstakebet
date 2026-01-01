import React from "react"
import { getAllSchools } from "@/lib/data"
import { VirtualsClient } from "./VirtualsClient"

export const dynamic = "force-dynamic"

export default async function VirtualsPage() {
    // Fetch all schools on the server
    const schoolsData = await getAllSchools()
    const schools = schoolsData.map(s => ({
        name: s.name,
        region: s.region
    }))

    return <VirtualsClient schools={schools} />
}
