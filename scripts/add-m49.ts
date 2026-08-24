import "dotenv/config"
import { Pool } from "@neondatabase/serverless"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const participants = [
    { odd: 1.85, name: "Aggrey Mem. Zion SHS", schoolId: "15aebeb1-56de-4d81-8055-9dfb8fed3248" },
    { odd: 1.85, name: "Presby SHTS, Osino", schoolId: "0ebe86e7-00be-44d8-878c-e8a2aed7f399" },
    { odd: 1.85, name: "Nkonya SHS", schoolId: "a15ee8a0-8ffc-445c-a2fc-ccfe67806c14" },
]

async function main() {
    const exists = await pool.query(`SELECT id FROM matches WHERE id = 'nsmq-2026-m49'`)
    if (exists.rows.length > 0) {
        console.log("m49 already exists, skipping")
        await pool.end()
        return
    }

    await pool.query(
        `INSERT INTO matches (id, tournament_id, participants, start_time, scheduled_at, status, stage, odds, sport_type, gender, margin, bet_volume, current_round, is_live, is_virtual)
         VALUES ($1,$2,$3,$4,$5,'upcoming','Preliminary Stage',$6,'quiz','male','0.1','{}',0,false,false)`,
        [
            "nsmq-2026-m49",
            "nsmq-2026",
            JSON.stringify(participants),
            "11:00 AM",
            new Date("2026-08-24T11:00:00.000Z"),
            JSON.stringify({
                "Match Winner": Object.fromEntries(participants.map(p => [p.schoolId, p.odd])),
            }),
        ]
    )

    console.log("Created nsmq-2026-m49:", participants.map(p => p.name).join(" vs "))
    await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
