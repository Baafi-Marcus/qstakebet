"use server"


import { db } from "./db"
import { schools, tournaments, schoolStrengths, matches } from "./db/schema"
import { eq, and, sql } from "drizzle-orm"

import { School, Tournament } from "./types"

/**
 * Smartly adds or updates schools in a bulk operation.
 * Helps prevent duplicates like "PRESEC" and "Presec Legon".
 */
export async function smartUpsertSchools(schoolList: string[], region: string) {
    const results = [];

    for (const name of schoolList) {
        const cleanName = name.trim();
        if (!cleanName) continue;

        // 1. Try to find existing school by exact name or similar name in same region
        // This is a simple version; real smart upsert might use fuzzy matching
        const existing = await db.select().from(schools)
            .where(and(
                eq(schools.region, region),
                sql`lower(${schools.name}) = lower(${cleanName})`
            ))
            .limit(1);

        if (existing.length > 0) {
            results.push({ ...existing[0], status: 'found' });
            continue;
        }

        // 2. If not found, create new
        const id = `sch-${Math.random().toString(36).substr(2, 9)}`;
        const newSchool = await db.insert(schools).values({
            id,
            name: cleanName,
            region: region,
        }).returning();

        results.push({ ...newSchool[0], status: 'created' });
    }

    return results;
}

export async function createTournament(data: {
    name: string,
    region: string,
    sportType: string,
    gender: string,
    year: string
}) {
    const id = `tmt-${Math.random().toString(36).substr(2, 9)}`;
    return await db.insert(tournaments).values({
        id,
        ...data,
        status: 'active'
    }).returning();
}

export async function createMatch(data: {
    tournamentId: string,
    schoolIds: string[],
    stage: string,
    startTime: string,
    sportType: string,
    gender: string
}) {
    // Parse datetime if provided
    let scheduledAt: Date | null = null;
    let status = "upcoming";
    let displayTime = data.startTime || "TBD";

    if (data.startTime) {
        try {
            scheduledAt = new Date(data.startTime);
            if (!isNaN(scheduledAt.getTime())) {
                const now = new Date();
                status = scheduledAt <= now ? "live" : "upcoming";
                displayTime = scheduledAt.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                scheduledAt = null;
            }
        } catch {
            scheduledAt = null;
        }
    }

    // 1. Calculate Odds
    const initialOdds = await calculateInitialOdds(data.schoolIds, data.sportType, data.gender);

    // 2. Fetch School Names (for simplified display/redundancy in JSON)
    const schoolDetails = await db.select().from(schools)
        .where(sql`${schools.id} IN ${data.schoolIds}`);

    // 3. Construct Participants JSON
    const participants = data.schoolIds.map(id => {
        const school = schoolDetails.find(s => s.id === id);
        return {
            schoolId: id,
            name: school?.name || "Unknown School",
            odd: initialOdds[id] || 2.00, // Fallback
            result: null
        };
    });

    const id = `mtc-${Math.random().toString(36).substr(2, 9)}`;

    return await db.insert(matches).values({
        id,
        tournamentId: data.tournamentId,
        participants: participants,
        startTime: displayTime,
        scheduledAt: scheduledAt,
        status: status,
        result: null,
        isLive: status === "live",
        stage: data.stage,
        odds: initialOdds,
        sportType: data.sportType,
        gender: data.gender,
        margin: 0.1
    }).returning();
}

/**
 * Generates automated odds based on school strengths.
 * If strengths don't exist, it defaults to balanced odds with margin.
 */
export async function calculateInitialOdds(schoolIds: string[], sportType: string, gender: string, margin: number = 0.1) {
    // 1. Fetch school ratings
    const strengths = await db.select().from(schoolStrengths)
        .where(and(
            eq(schoolStrengths.sportType, sportType),
            eq(schoolStrengths.gender, gender)
        ));

    // 2. Calculate probabilities
    let totalPower = 0;
    const schoolPowers = schoolIds.map(id => {
        const s = strengths.find(st => st.schoolId === id);
        const power = (s?.rating as { overall?: number })?.overall || 50; // Default power 50
        totalPower += power;
        return { id, power };
    });

    // 3. Convert power to odd: Odd = 1 / (Prob * (1 - Margin))
    const odds: Record<string, number> = {};
    schoolPowers.forEach(sp => {
        const prob = sp.power / totalPower;
        const rawOdd = 1 / prob;
        // Apply margin: Final Odd = Raw Odd * (1 - Margin)
        // e.g. for a 50/50, raw odd is 2.0. With 10% margin, displayed odd is 1.8
        odds[sp.id] = parseFloat((rawOdd * (1 - margin)).toFixed(2));
    });

    return odds;
}

