"use server"

import { db } from "@/lib/db"
import { users, schools, fantasyLineups } from "@/lib/db/schema"
import { eq, and, or, desc, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function submitLineup(gameWeek: string, schoolIds: string[]) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return { success: false, error: "Please log in to submit a fantasy lineup" }
        }

        if (schoolIds.length !== 3) {
            return { success: false, error: "A fantasy lineup must contain exactly 3 schools" }
        }

        const userId = session.user.id

        // Fetch details of the selected schools
        const selectedSchools = await db.select()
            .from(schools)
            .where(
                or(
                    eq(schools.id, schoolIds[0]),
                    eq(schools.id, schoolIds[1]),
                    eq(schools.id, schoolIds[2])
                )
            )

        if (selectedSchools.length !== 3) {
            return { success: false, error: "One or more selected schools were not found in the database" }
        }

        // Calculate credit cost
        const getCreditCost = (category: string | null) => {
            if (category === 'A') return 45;
            if (category === 'B') return 35;
            if (category === 'C') return 25;
            return 20;
        }

        const totalCredits = selectedSchools.reduce((sum, s) => sum + getCreditCost(s.category), 0)

        if (totalCredits > 100) {
            return { success: false, error: `Your selected lineup cost is ${totalCredits} credits, which exceeds the 100-credit budget` }
        }

        // Check for existing lineup for this gameWeek
        const existing = await db.select()
            .from(fantasyLineups)
            .where(
                and(
                    eq(fantasyLineups.userId, userId),
                    eq(fantasyLineups.gameWeek, gameWeek)
                )
            )
            .limit(1)

        const lineupId = existing.length > 0 ? existing[0].id : `fln-${Math.random().toString(36).substr(2, 9)}`

        if (existing.length > 0) {
            await db.update(fantasyLineups)
                .set({
                    school1Id: schoolIds[0],
                    school2Id: schoolIds[1],
                    school3Id: schoolIds[2],
                    creditsSpent: totalCredits,
                    updatedAt: new Date()
                })
                .where(eq(fantasyLineups.id, lineupId))
        } else {
            await db.insert(fantasyLineups)
                .values({
                    id: lineupId,
                    userId,
                    gameWeek,
                    school1Id: schoolIds[0],
                    school2Id: schoolIds[1],
                    school3Id: schoolIds[2],
                    creditsSpent: totalCredits
                })
        }

        return { success: true, totalCredits }
    } catch (error: any) {
        console.error("Error in submitLineup:", error)
        return { success: false, error: error.message || "An unexpected error occurred" }
    }
}

export async function getUserLineup(userId: string, gameWeek: string) {
    try {
        const lineupData = await db.select({
            lineup: fantasyLineups,
            school1: schools,
        })
            .from(fantasyLineups)
            .leftJoin(schools, eq(fantasyLineups.school1Id, schools.id))
            .where(
                and(
                    eq(fantasyLineups.userId, userId),
                    eq(fantasyLineups.gameWeek, gameWeek)
                )
            )
            .limit(1)

        if (!lineupData.length) return null

        const lineup = lineupData[0].lineup

        // Fetch other two schools
        const school2Data = await db.select().from(schools).where(eq(schools.id, lineup.school2Id)).limit(1)
        const school3Data = await db.select().from(schools).where(eq(schools.id, lineup.school3Id)).limit(1)

        return {
            id: lineup.id,
            gameWeek: lineup.gameWeek,
            creditsSpent: lineup.creditsSpent,
            pointsEarned: lineup.pointsEarned,
            status: lineup.status,
            createdAt: lineup.createdAt,
            schools: [
                lineupData[0].school1,
                school2Data[0] || null,
                school3Data[0] || null
            ].filter(Boolean)
        }
    } catch (error) {
        console.error("Error in getUserLineup:", error)
        return null
    }
}

export async function getLeaderboard(gameWeek?: string) {
    try {
        if (gameWeek) {
            // Retrieve points for specific game week
            const results = await db.select({
                username: users.name,
                almaMater: users.almaMater,
                points: fantasyLineups.pointsEarned,
            })
                .from(fantasyLineups)
                .innerJoin(users, eq(fantasyLineups.userId, users.id))
                .where(eq(fantasyLineups.gameWeek, gameWeek))
                .orderBy(desc(fantasyLineups.pointsEarned))
                .limit(50)

            return results
        } else {
            // Retrieve lifetime rankings
            const results = await db.select({
                username: users.name,
                almaMater: users.almaMater,
                points: users.lifetimePoints,
            })
                .from(users)
                .orderBy(desc(users.lifetimePoints))
                .limit(50)

            return results
        }
    } catch (error) {
        console.error("Error in getLeaderboard:", error)
        return []
    }
}

export async function getUserFantasyStats() {
    try {
        const session = await auth()
        if (!session?.user?.id) return { success: false, error: "Not logged in" }
        
        const userData = await db.select({
            lifetimePoints: users.lifetimePoints,
            almaMater: users.almaMater
        })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1)
            
        if (!userData.length) return { success: false, error: "User not found" }
        return { 
            success: true, 
            lifetimePoints: userData[0].lifetimePoints, 
            almaMater: userData[0].almaMater 
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

