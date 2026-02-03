"use server"

import { db } from "@/lib/db"
import { apiKeys } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getApiKeys() {
    return await db.select().from(apiKeys).orderBy(apiKeys.createdAt)
}

export async function addApiKey(data: { key: string, provider: string, label?: string }) {
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
    await db.update(apiKeys)
        .set({ isActive })
        .where(eq(apiKeys.id, keyId))

    revalidatePath("/admin/settings")
    return { success: true }
}

export async function deleteApiKey(keyId: string) {
    await db.delete(apiKeys).where(eq(apiKeys.id, keyId))
    revalidatePath("/admin/settings")
    return { success: true }
}
