"use server"

import { getAllMatchesWithTournaments } from "./data"

export async function getMatchStatsByRegion() {
    const matches = await getAllMatchesWithTournaments()

    // Structure: { [regionName]: { [sportType]: count, total: number } }
    const stats: Record<string, Record<string, number>> = {}

    matches.forEach(match => {
        // Normalize region from database to match UI labels
        const dbRegion = (match.region || "National").toLowerCase().trim()

        // Find exact match in our UI display names if possible
        const regionLabels: Record<string, string> = {
            "ahafo": "Ahafo",
            "ashanti": "Ashanti",
            "bono": "Bono",
            "bono-east": "Bono East",
            "central": "Central",
            "eastern": "Eastern",
            "greater-accra": "Greater Accra",
            "north-east": "North East",
            "northern": "Northern",
            "oti": "Oti",
            "savannah": "Savannah",
            "upper-east": "Upper East",
            "upper-west": "Upper West",
            "volta": "Volta",
            "western": "Western",
            "western-north": "Western North",
            "national": "National"
        }

        const region = regionLabels[dbRegion] || dbRegion.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

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
