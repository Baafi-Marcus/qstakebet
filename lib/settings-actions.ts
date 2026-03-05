"use server"

import { db } from "@/lib/db"
import { platformSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"

export async function getSettings() {
    return unstable_cache(
        async () => {
            try {
                const settings = await db.select().from(platformSettings);
                const settingsMap: Record<string, any> = {};
                settings.forEach(s => {
                    settingsMap[s.key] = s.value;
                });
                return settingsMap;
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                return {};
            }
        },
        ["platform-settings"],
        { tags: ["platform-settings"] }
    )();
}

export async function getSetting(key: string, defaultValue: any = null) {
    const settings = await getSettings();
    return settings[key] ?? defaultValue;
}

export async function updateSetting(key: string, value: any, description?: string) {
    try {
        const existing = await db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);

        if (existing.length > 0) {
            await db.update(platformSettings)
                .set({
                    value,
                    description: description ?? existing[0].description,
                    updatedAt: new Date()
                })
                .where(eq(platformSettings.key, key));
        } else {
            await db.insert(platformSettings).values({
                key,
                value,
                description: description ?? "",
            });
        }

        revalidatePath("/admin/settings");
        revalidateTag("platform-settings");
        return { success: true };
    } catch (error) {
        console.error(`Failed to update setting ${key}:`, error);
        return { success: false, error: "Failed to update setting" };
    }
}
