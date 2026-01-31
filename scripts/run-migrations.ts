import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
    const migrationDir = join(process.cwd(), 'drizzle');
    const files = readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
        console.log(`Applying ${file}...`);
        const content = readFileSync(join(migrationDir, file), 'utf8');
        const statements = content.split('--> statement-breakpoint');

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed) {
                try {
                    await (sql as any)(trimmed);
                } catch (err: any) {
                    if (err.message.includes('already exists')) {
                        console.warn(`  Warning: Object already exists, skipping statement.`);
                    } else {
                        console.error(`  Error applying statement: ${err.message}`);
                        // Don't throw for some errors to allow partial completion if some tables already exist
                    }
                }
            }
        }
        console.log(`Finished ${file}`);
    }
}

migrate().catch(console.error);
