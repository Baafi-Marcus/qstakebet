import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { SchoolsClient } from "./SchoolsClient"
import { asc } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
    const allSchools = await db.select({
        id: schools.id,
        name: schools.name,
        region: schools.region,
        district: schools.district,
        category: schools.category,
        level: schools.level,
        type: schools.type,
        parentId: schools.parentId
    })
        .from(schools)
        .orderBy(asc(schools.name))

    return <SchoolsClient initialSchools={allSchools as any} />
}
