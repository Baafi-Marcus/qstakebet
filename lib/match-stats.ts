"use server"

import { getAllMatches } from "./data"

export async function getMatchStatsByRegion() {
    const matches = await getAllMatches()

    // Structure: { [regionName]: { [sportType]: count, total: number } }
    const stats: Record<string, Record<string, number>> = {}

    matches.forEach(match => {
        // Find region from tournament or participants if available, 
        // but since our REGIONS list in UI is static, we'll try to match it.
        // For now, we assume tournaments have the region.
        const region = match.stage.split(' ').pop() || "National" // Fallback or logic to extract

        // Better logic: Match against the known regions if possible
        // This is a placeholder for real region resolution logic
        // In a real app, match.tournament.region would be the source.

        const sport = match.sportType.toLowerCase()

        if (!stats[region]) {
            stats[region] = { total: 0 }
        }

        if (!stats[region][sport]) {
            stats[region][sport] = 0
        }

        stats[region][sport]++
        stats[region].total++
    })

    return stats
}
