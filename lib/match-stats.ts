"use server"

import { getAllMatchesWithTournaments } from "./data"

export async function getMatchStatsByRegion() {
    const matches = await getAllMatchesWithTournaments()

    // Structure: { [regionName]: { [sportType]: count, total: number } }
    const stats: Record<string, Record<string, number>> = {}

    matches.forEach(match => {
        // Normalize region from database to match UI labels
        // DB might have "ashanti" while UI has "Ashanti"
        let region = match.region || "National"

        // Capitalize first letter and handle special cases if needed
        region = region.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

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
