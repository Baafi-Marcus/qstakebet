"use server"

import { db } from "@/lib/db"
import { apiKeys } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { isAdmin } from "./admin-utils"

export async function getApiKeys() {
    if (!(await isAdmin())) return [];
    return await db.select().from(apiKeys).orderBy(apiKeys.createdAt)
}

export async function addApiKey(data: { key: string, provider: string, label?: string }) {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
    const id = `key-${Math.random().toString(36).substr(2, 9)}`

    await db.insert(apiKeys).values({
        id,
        key: data.key,
        provider: data.provider,
        label: data.label || null,
        isActive: true,
        usageCount: 0,
        errorCount: 0
    })

    revalidatePath("/admin/settings")
    return { success: true }
}

export async function toggleApiKey(keyId: string, isActive: boolean) {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
    await db.update(apiKeys)
        .set({ isActive })
        .where(eq(apiKeys.id, keyId))

    revalidatePath("/admin/settings")
    return { success: true }
}

export async function deleteApiKey(keyId: string) {
    if (!(await isAdmin())) return { success: false, error: "Unauthorized" };
    await db.delete(apiKeys).where(eq(apiKeys.id, keyId))
    revalidatePath("/admin/settings")
    return { success: true }
}
