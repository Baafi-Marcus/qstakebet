const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_DgW9PN5darkG@ep-snowy-scene-ahkphlbd-pooler.c-3.us-east-1.aws.neon.tech/New%20World?sslmode=require"
    });

    try {
        await client.connect();
        
        console.log("Deleting dependencies...");
        await client.query(`DELETE FROM fantasy_lineups WHERE user_id = 'test-usr-1';`);
        
        console.log("Deleting user...");
        await client.query(`DELETE FROM users WHERE id = 'test-usr-1';`);
        
        console.log("User successfully deleted.");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
