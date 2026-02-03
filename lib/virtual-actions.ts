"use server"

import { db } from "@/lib/db"
import { virtualSchoolStats, schools, schoolStrengths } from "@/lib/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { VirtualMatchOutcome } from "@/lib/virtuals"
import { VirtualSchool } from "@/lib/virtuals" // Ensure type is imported

// ... existing code ...

export async function getPlayableSchools(): Promise<VirtualSchool[]> {
    try {
        // Fetch all schools from the DB
        // If DB is empty, this returns empty. 
        // In a real app we might seed it.
        const allSchools = await db.select({
            name: schools.name,
            region: schools.region
        }).from(schools);

        if (allSchools.length > 0) {
            return allSchools;
        }

        // Fallback if DB empty
        return [];
    } catch (e) {
        console.error("Failed to fetch real schools:", e);
        return [];
    }
}

// AI Learning Rate
const LEARNING_RATE = 0.05;
const VOLATILITY_DECAY = 0.98;

export async function updateSchoolStats(results: VirtualMatchOutcome[]) {
    try {
        for (const match of results) {
            const winnerName = match.schools[match.winnerIndex];

            // We need to resolve school names to IDs. 
            // For now, assuming names are unique or mapped. 
            // In a real scenario, we'd pass IDs.
            // Fetching School IDs based on names (Optimized in real app)
            const schoolRecords = await db.select().from(schools).where(inArray(schools.name, match.schools));

            for (const school of schoolRecords) {
                // Find existing stats or create
                const existingStats = await db.select().from(virtualSchoolStats)
                    .where(eq(virtualSchoolStats.schoolId, school.id))
                    .limit(1);

                let stats = existingStats[0];

                if (!stats) {
                    // Initialize
                    const newId = `vss-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                    [stats] = await db.insert(virtualSchoolStats).values({
                        id: newId,
                        schoolId: school.id,
                        matchesPlayed: 0,
                        wins: 0,
                        currentForm: 1.0,
                        volatilityIndex: 0.1
                    }).returning();
                }

                // AI LOGIC: Update Form
                const isWinner = school.name === winnerName;
                const performanceDelta = isWinner ? LEARNING_RATE : - (LEARNING_RATE / 2);

                // Form Clamping (0.5 to 2.0)
                let newForm = (stats.currentForm || 1.0) + performanceDelta;
                newForm = Math.max(0.5, Math.min(2.0, newForm));

                // Volatility Update (Increase if upset)
                // Simplified: If winner had low form, increase volatility for everyone in match?
                // Just decay volatility for stability over time
                const newVolatility = (stats.volatilityIndex || 0.1) * VOLATILITY_DECAY;

                await db.update(virtualSchoolStats).set({
                    matchesPlayed: (stats.matchesPlayed || 0) + 1,
                    wins: (stats.wins || 0) + (isWinner ? 1 : 0),
                    currentForm: newForm,
                    volatilityIndex: newVolatility,
                    lastUpdated: new Date()
                }).where(eq(virtualSchoolStats.id, stats.id));
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to update AI stats:", error);
        return { success: false, error: "Failed to learn from matches" };
    }
}

export async function getAIStrengths(schoolNames: string[]) {
    // If table is empty or schools not found, return defaults/randoms
    // This allows the simulation to fall back to random if "AI" hasn't learned yet.
    try {
        const schoolRecords = await db.select({
            name: schools.name,
            form: virtualSchoolStats.currentForm,
            volatility: virtualSchoolStats.volatilityIndex
        })
            .from(schools)
            .leftJoin(virtualSchoolStats, eq(schools.id, virtualSchoolStats.schoolId))
            .where(inArray(schools.name, schoolNames));

        return schoolRecords;
    } catch (error) {
        return [];
    }
}
