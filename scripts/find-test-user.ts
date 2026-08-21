import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { like, or } from "drizzle-orm";

async function run() {
    const allUsers = await db.select().from(users).where(
        or(
            like(users.name, '%test%'),
            like(users.name, '%Test%'),
            like(users.email, '%test%')
        )
    );
    console.log(allUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })));
    process.exit(0);
}
run();
