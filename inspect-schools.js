const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        const rows = await sql('SELECT name, region, category FROM schools');
        console.log(`Total Schools: ${rows.length}`);

        const regions = [...new Set(rows.map(r => r.region))];
        console.log(`Regions (${regions.length}): ${regions.join(', ')}`);

        const catA = rows.filter(r => r.category === 'A' || r.category === 'a');
        console.log(`Category A Schools: ${catA.length}`);

        console.log('Sample Schools:');
        console.log(JSON.stringify(rows.slice(0, 5), null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
