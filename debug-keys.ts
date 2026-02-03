import { db } from "./lib/db"
import { apiKeys } from "./lib/db/schema"

async function main() {
    try {
        const keys = await db.select().from(apiKeys);
        console.log("--- API KEYS STATUS ---");
        if (keys.length === 0) {
            console.log("No keys found in database.");
        } else {
            console.table(keys.map(k => ({
                id: k.id,
                label: k.label,
                provider: k.provider,
                isActive: k.isActive,
                usage: k.usageCount,
                errors: k.errorCount,
                lastUsed: k.lastUsedAt
            })));
        }
        process.exit(0);
    } catch (e) {
        console.error("Failed to check keys:", e);
        process.exit(1);
    }
}

main();
