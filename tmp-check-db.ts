process.env.DATABASE_URL = "postgresql://neondb_owner:npg_DgW9PN5darkG@ep-snowy-scene-ahkphlbd-pooler.c-3.us-east-1.aws.neon.tech/New%20World?sslmode=require";
import { db } from './lib/db';
import { schools } from './lib/db/schema';
import { BEST_27_SCHOOLS, DEFAULT_SCHOOLS } from './lib/virtuals';

async function main() {
    const allSchools = await db.select().from(schools);
    const dbNames = allSchools.map(s => s.name);

    console.log("DB count:", dbNames.length);
    console.log("Are any BEST_27 in DB?");
    console.log(BEST_27_SCHOOLS.filter(s => dbNames.includes(s)));

    console.log("BEST_27 that are NOT in DB:");
    console.log(BEST_27_SCHOOLS.filter(s => !dbNames.includes(s)));

    console.log("All DB schools:", dbNames);
    process.exit(0);
}
main();
