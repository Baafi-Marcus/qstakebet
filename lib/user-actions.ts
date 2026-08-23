"use server"

import { db } from "@/lib/db"
import { users, schools } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"

/**
 * Lightweight school list for pickers (e.g. chat school badge).
 */
export async function getSchoolsForPicker() {
    try {
        const rows = await db
            .select({ id: schools.id, name: schools.name, region: schools.region })
            .from(schools)
            .orderBy(asc(schools.name))
        return { success: true, schools: rows }
    } catch (e) {
        console.error("getSchoolsForPicker error:", e)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Sets the logged-in user's alma mater (must exist in the global schools table).
 */
export async function updateAlmaMater(schoolId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }
    if (!schoolId) return { success: false, error: "School is required" }

    try {
        const school = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1)
        if (!school.length) return { success: false, error: "School not found" }

        await db.update(users)
            .set({ almaMater: school[0].name, updatedAt: new Date() })
            .where(eq(users.id, session.user.id))

        return { success: true, almaMater: school[0].name }
    } catch (e) {
        console.error("updateAlmaMater error:", e)
        return { success: false, error: "Internal Error" }
    }
}

/**
 * Fetches essential user summary for the minimalist profile page.
 */
export async function getUserProfileSummary() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { name: true, phone: true, createdAt: true, email: true, phoneVerified: true }
        })

        return {
            success: true,
            user,
        }
    } catch (e) {
        return { success: false, error: "Internal Error" }
    }
}


/**
 * Updates user profile information.
 */
export async function updateUserProfile(formData: { name?: string; phone?: string }) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    try {
        const userId = session.user.id
        await db.update(users)
            .set({
                name: formData.name,
                phone: formData.phone,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId))

        return { success: true }
    } catch (e) {
        console.error("Update profile error:", e)
        return { success: false, error: "Internal Error" }
    }
}

