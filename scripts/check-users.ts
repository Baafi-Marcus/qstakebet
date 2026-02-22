import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

async function manageUsers() {
    const targetAdmin = "0544865254";
    const otherUser = "0257833426";
    const removeAdmin = "0243178229";

    try {
        console.log("--- User Management Operation ---");

        // 1. Check status of new numbers
        const targets = await db.select({
            id: users.id,
            phone: users.phone,
            role: users.role
        }).from(users).where(
            require("drizzle-orm").or(
                require("drizzle-orm").eq(users.phone, targetAdmin),
                require("drizzle-orm").eq(users.phone, otherUser)
            )
        );

        console.log("Current status of requested numbers:");
        targets.forEach(u => console.log(`- Phone: ${u.phone}, Role: ${u.role}, ID: ${u.id}`));

        const hasAdminTarget = targets.find(t => t.phone === targetAdmin);

        // 2. Make second one admin
        if (hasAdminTarget) {
            console.log(`Setting ${targetAdmin} as admin...`);
            await db.update(users)
                .set({ role: "admin" })
                .where(require("drizzle-orm").eq(users.phone, targetAdmin));
        } else {
            console.log(`Warning: ${targetAdmin} not found in database. User must register first.`);
        }

        // 3. Remove old admin
        console.log(`Removing old admin ${removeAdmin}...`);
        await db.delete(users).where(require("drizzle-orm").eq(users.phone, removeAdmin));

        console.log("Operation complete.");

        // Final check
        const finalUsers = await db.select({
            id: users.id,
            phone: users.phone,
            role: users.role
        }).from(users);
        console.log("\nFinal User List:");
        finalUsers.forEach(u => console.log(`- ${u.phone} (${u.role})`));

    } catch (error: any) {
        console.error("Error:", error.message || error);
    } finally {
        process.exit();
    }
}

manageUsers();
