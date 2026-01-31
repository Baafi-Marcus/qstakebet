import { db } from "@/lib/db"
import { schools } from "@/lib/db/schema"
import { SchoolsClient } from "./SchoolsClient"
import { asc } from "drizzle-orm"

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
    // Fetch all schools from the database
    const allSchools = await db.select().from(schools).orderBy(asc(schools.name))

    return <SchoolsClient initialSchools={allSchools} />
}
