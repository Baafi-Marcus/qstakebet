import { db } from "@/lib/db"
import { apiKeys } from "@/lib/db/schema"
import { eq, and, asc, sql } from "drizzle-orm"

/**
 * Get an active API key for the provider.
 * Logic: Get active keys, sort by usage count (load balancing), pick first.
 * If no keys in DB, fallback to ENV.
 */
export async function getActiveKey(provider: string = "github_models"): Promise<string | null> {
    try {
        const keys = await db.select().from(apiKeys)
            .where(and(
                eq(apiKeys.provider, provider),
                eq(apiKeys.isActive, true)
            ))
            .orderBy(asc(apiKeys.usageCount))
            .limit(1);

        if (keys.length > 0) {
            const selectedKey = keys[0];

            // Increment usage (fire and forget)
            await db.update(apiKeys)
                .set({
                    usageCount: selectedKey.usageCount + 1,
                    lastUsedAt: new Date()
                })
                .where(eq(apiKeys.id, selectedKey.id));

            return selectedKey.key;
        }
    } catch (error) {
        console.error("Error fetching API key from DB:", error);
    }

    // Fallback
    if (provider === "github_models") return process.env.GITHUB_TOKEN || null;
    return null;
}

/**
 * Report a failure for a specific key (by value for simplicity if we don't carry ID everywhere, 
 * but checking by Value is risky if duplicate. Better to pass ID if possible, but for this simple parser:
 * We will lookup by key value if needed, or just let the caller handle it differently.
 * 
 * Ideally, getActiveKey returns { id, key }.
 */
export async function reportKeyError(keyData: string) {
    try {
        // Find key by value (assuming unique enough or just hit first match)
        // In real prod, use ID.
        const keys = await db.select().from(apiKeys).where(eq(apiKeys.key, keyData)).limit(1);
        if (!keys.length) return;

        const key = keys[0];
        const newErrorCount = key.errorCount + 1;

        const updateData: any = { errorCount: newErrorCount };

        // Auto-disable if too many errors
        if (newErrorCount >= 5) {
            updateData.isActive = false;
            console.warn(`API Key ${key.id} disabled due to excessive errors.`);
        }

        await db.update(apiKeys).set(updateData).where(eq(apiKeys.id, key.id));

    } catch (error) {
        console.error("Error reporting key error:", error);
    }
}
