import { db } from "@/lib/db"
import { schools, virtualSchoolStats } from "@/lib/db/schema"
import { SchoolsClient } from "./SchoolsClient"
import { asc, eq } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
    // Fetch all schools with their AI stats
    const allSchoolsWithStats = await db.select({
        id: schools.id,
        name: schools.name,
        region: schools.region,
        district: schools.district,
        category: schools.category,
        currentForm: virtualSchoolStats.currentForm,
        volatilityIndex: virtualSchoolStats.volatilityIndex,
        matchesPlayed: virtualSchoolStats.matchesPlayed,
        wins: virtualSchoolStats.wins
    })
        .from(schools)
        .leftJoin(virtualSchoolStats, eq(schools.id, virtualSchoolStats.schoolId))
        .orderBy(asc(schools.name))

    return <SchoolsClient initialSchools={allSchoolsWithStats as any} />
}
