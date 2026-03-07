import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Robust check to verify if the current user has admin privileges.
 * This should be used inside ALL administrative Server Actions to provide
 * "Defense in Depth" (e.g. if Middleware is bypassed or misconfigured).
 */
export async function isAdmin() {
    try {
        const session = await auth()
        if (!session?.user?.id) return false

        // Check the database directly for the role to ensure it's not tampered with in the session
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { role: true, status: true }
        })

        return user?.role === "admin" && user?.status === "active"
    } catch (error) {
        console.error("[SECURITY] Admin check failed:", error)
        return false
    }
}

/**
 * Throws an error if the user is not an admin.
 * Useful for cleaner Server Action code.
 */
export async function ensureAdmin() {
    if (!(await isAdmin())) {
        throw new Error("Unauthorized: Admin privileges required")
    }
}
