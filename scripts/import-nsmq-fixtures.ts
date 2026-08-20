import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not configured in .env");
    process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

// Guess region from name helper
function guessRegionFromName(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("kumasi") || n.includes("bekwai") || n.includes("bompata") || n.includes("obuasi") || n.includes("konongo") || n.includes("juaben") || n.includes("asante") || n.includes("tepa") || n.includes("okomfo") || n.includes("hubert")) {
        return "Ashanti";
    }
    if (n.includes("accra") || n.includes("tema") || n.includes("labone") || n.includes("o'reilly") || n.includes("ghanata")) {
        return "Greater Accra";
    }
    if (n.includes("tamale") || n.includes("yendi") || n.includes("nalerigu") || n.includes("navrongo") || n.includes("kanton") || n.includes("kalpohin")) {
        return "Northern";
    }
    if (n.includes("koforidua") || n.includes("aburi") || n.includes("suhum") || n.includes("nifa") || n.includes("odumase") || n.includes("abomosu") || n.includes("kade") || n.includes("manya krobo") || n.includes("yilo krobo") || n.includes("benkum") || n.includes("panin") || n.includes("oyoko")) {
        return "Eastern";
    }
    if (n.includes("ho") || n.includes("kpando") || n.includes("denu") || n.includes("anlo") || n.includes("sogakope") || n.includes("vakpo") || n.includes("bueman") || n.includes("kadjebi") || n.includes("abor")) {
        return "Volta";
    }
    if (n.includes("cape coast") || n.includes("mfantsiman") || n.includes("winneba") || n.includes("edinaman") || n.includes("holy child") || n.includes("nyakrom") || n.includes("apam") || n.includes("mankessim")) {
        return "Central";
    }
    if (n.includes("sekondi") || n.includes("fijai") || n.includes("tarkwa") || n.includes("shama") || n.includes("ahantaman")) {
        return "Western";
    }
    if (n.includes("sunyani") || n.includes("techiman") || n.includes("berekum") || n.includes("wenchi")) {
        return "Bono";
    }
    if (n.includes("wa")) {
        return "Upper West";
    }
    if (n.includes("bolgatanga") || n.includes("sandema")) {
        return "Upper East";
    }
    return "National";
}

// 48 Preliminary Matches
const fixtures = [
  // Day 1: Aug 20, 2026
  { id: 1, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Edinaman SHS", "Abomosu STEM SHS", "Wa SHS"] },
  { id: 2, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["St. Hubert Sem. SHS", "Akwamuman SHS", "Bright SHS"] },
  { id: 3, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Accra Girls' SHS", "Asamankese SHS", "Sandema SHS"] },
  { id: 4, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Techiman SHS", "Wesley High Sch., Bekwai", "Esaase Bontefufuo SHTS"] },
  { id: 5, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Sacred Heart SHS", "Presby SHS, Bompata", "Mansen SHS"] },
  { id: 6, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Nandom SHS", "Ghana SHS, Koforidua", "Tuobodom SHTS"] },
  { id: 7, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Sekondi College", "Akumfi Ameyaw SHTS", "Benkum SHS"] },
  { id: 8, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["Kumasi High School", "Jachie Pramso SHS", "Nalerigu SHS"] },
  { id: 9, date: "2026-08-20T11:00:00.000Z", startTime: "11:00 AM", schools: ["St. Louis SHS", "SDA SHS, Bekwai", "T. I. Amass, Salaga"] },

  // Day 2: Aug 21, 2026
  { id: 10, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Tema Sec. School", "Tarkwa SHS", "St. Paul's SHS, Denu"] },
  { id: 11, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Ghanata SHS", "Yendi SHS", "O'Reilly SHS"] },
  { id: 12, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["St. Joseph Sem. SHS", "KNUST SHS", "SDA SHS, Agona"] },
  { id: 13, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Pentecost SHS, Koforidua", "St. Francis Xavier Jnr. Sem.", "Nana Brentu SHS"] },
  { id: 14, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Ofori Panin SHS", "Oyoko Methodist SHS", "Mim SHS"] },
  { id: 15, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Osei Kyeretwie SHS", "Kumasi Girls' SHS", "Tamale Girls' SHS"] },
  { id: 16, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Tamale SHS", "Kalpohin SHS", "Wenchi Methodist SHS"] },
  { id: 17, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Kadjebi Asato SHS", "Ahantaman Girls' SHS", "Ada SHTS, Sege"] },
  { id: 18, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Anglican SHS, Kumasi", "Namong SHTS", "Shama SHS"] },
  { id: 19, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Wesley Girls' High School", "Simms SHS", "Nkwatia Presby SHS"] },
  { id: 20, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Notre Dame Sem. SHS", "Labone SHS", "T. I. Amass, Wa"] },
  { id: 21, date: "2026-08-21T11:00:00.000Z", startTime: "11:00 AM", schools: ["Fijai SHS", "Winneba Secondary School", "Enyan Denkyira SHTS"] },

  // Day 3: Aug 22, 2026
  { id: 22, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Yilo Krobo SHS", "Wesley Grammar Sch.", "Kofi Agyei SHTS"] },
  { id: 23, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["T. I. Amass, Kumasi", "Adiembra SHS", "Presby SHS, Bechem"] },
  { id: 24, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Ola SHS, Ho", "Presby SHTS, Aburi", "Our Lady of Lourdes Girls'"] },
  { id: 25, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["West Africa SHS", "Mankessim SHTS", "Oda SHS"] },
  { id: 26, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["St. John's Grammar Sch.", "Zion College", "St. Mary's Sem. SHS, Lolobi"] },
  { id: 27, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Mfantsiman Girls' SHS", "Kade SHTS", "Serwaa Kesse Girls' SHS"] },
  { id: 28, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Manya Krobo SHS", "St. Charles Min. Sem.", "Anum Presby SHS"] },
  { id: 29, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Kumasi Academy", "Bueman SHS", "Hohoe E. P. SHS"] },
  { id: 30, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Kumasi Sec. Tech.", "St. Mary's SHS", "Agona SHTS"] },
  { id: 31, date: "2026-08-22T11:00:00.000Z", startTime: "11:00 AM", schools: ["Senya SHS", "Asanteman SHS", "Awe SHTS"] },

  // Day 4: Aug 23, 2026
  { id: 32, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Boa Amponsem SHS", "Berekum SHS", "Bolgatanga Girls' SHS"] },
  { id: 33, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Vakpo SHS", "Presby SHTS, Adeiso", "Wovenu SHTS"] },
  { id: 34, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Bishop Herman College", "Yaa Asantewaa Girls'", "Dabala SHTS"] },
  { id: 35, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Anlo SHS", "Holy Child School", "Nkawkaw SHS"] },
  { id: 36, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Nsutaman Cath. SHS", "Serwaa Nyarko Girls'", "Hope College"] },
  { id: 37, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Kpando SHS", "Abor SHS", "Jukwa SHTS"] },
  { id: 38, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Ejisuman SHS", "Fafraha Comm. SHS", "Awudome SHS"] },
  { id: 39, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Navrongo SHS", "Presby SHS, Suhum", "Bepong SHS"] },
  { id: 40, date: "2026-08-23T11:00:00.000Z", startTime: "11:00 AM", schools: ["Konongo Odumase SHS", "Our Lady of Mt. Carmel Girls'", "Juaben SHS"] },

  // Day 5: Aug 24, 2026
  { id: 41, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Amenfiman SHS", "St. Monica's SHS", "Tema Methodist Day"] },
  { id: 42, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Ghana SHS, Tamale", "Accra High School", "Sunyani SHS"] },
  { id: 43, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Chemu SHTS", "Saviour SHS", "Wallahs Academy"] },
  { id: 44, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Tepa SHS", "Adu Gyamfi SHS", "Suhum SHTS"] },
  { id: 45, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Nyakrom SHTS", "St. Mary's Boys', Apowa", "Sonrise Christian High"] },
  { id: 46, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Sogakope SHS", "Okomfo Anokye SHS", "Apam SHS"] },
  { id: 47, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Nifa SHS", "Afua Kobi Ampem Girls'", "Kanton SHS"] },
  { id: 48, date: "2026-08-24T11:00:00.000Z", startTime: "11:00 AM", schools: ["Armed Forces SHTS", "Tamale Islamic Science", "Islamic SHS, Kumasi"] }
];

async function run() {
    try {
        console.log("Starting NSMQ fixtures import...");

        for (const item of fixtures) {
            console.log(`Processing Match ${item.id}: ${item.schools.join(" vs ")}`);

            const schoolIds: string[] = [];

            for (const sName of item.schools) {
                // Check if school exists (case insensitive search)
                const existing = await sql`
                    SELECT id FROM schools WHERE LOWER(name) = LOWER(${sName.trim()})
                `;

                if (existing.length > 0) {
                    schoolIds.push(existing[0].id);
                } else {
                    // Create new school
                    const newId = crypto.randomUUID();
                    const region = guessRegionFromName(sName);
                    const gender = sName.toLowerCase().includes("girls") ? "female" : sName.toLowerCase().includes("boys") ? "male" : "mixed";
                    
                    console.log(`School "${sName}" not found. Auto-creating with ID: ${newId}, Region: ${region}`);
                    
                    await sql`
                        INSERT INTO schools (id, name, region, level, type, aliases, created_at)
                        VALUES (${newId}, ${sName.trim()}, ${region}, 'shs', 'school', '[]'::jsonb, NOW())
                    `;
                    
                    schoolIds.push(newId);
                }
            }

            // Build match properties
            const matchId = `nsmq-2026-m${item.id}`;
            const participants = item.schools.map((name, idx) => ({
                schoolId: schoolIds[idx],
                name: name,
                odd: 1.85 // Default competitive 3-way NSMQ odds
            }));

            const odds = {
                "Match Winner": {
                    [schoolIds[0]]: 1.85,
                    [schoolIds[1]]: 1.85,
                    [schoolIds[2]]: 1.85
                }
            };

            // Check if match already exists
            const existingMatch = await sql`
                SELECT id FROM matches WHERE id = ${matchId}
            `;

            if (existingMatch.length > 0) {
                console.log(`Match ${matchId} already exists. Updating details...`);
                await sql`
                    UPDATE matches
                    SET 
                        tournament_id = 'nsmq-2026',
                        participants = ${JSON.stringify(participants)},
                        start_time = ${item.startTime},
                        scheduled_at = ${new Date(item.date).toISOString()},
                        status = 'upcoming',
                        stage = 'Preliminary Stage',
                        odds = ${JSON.stringify(odds)},
                        sport_type = 'quiz'
                    WHERE id = ${matchId}
                `;
            } else {
                console.log(`Inserting new match ${matchId}...`);
                await sql`
                    INSERT INTO matches (id, tournament_id, participants, start_time, scheduled_at, status, stage, odds, sport_type)
                    VALUES (
                        ${matchId},
                        'nsmq-2026',
                        ${JSON.stringify(participants)},
                        ${item.startTime},
                        ${new Date(item.date).toISOString()},
                        'upcoming',
                        'Preliminary Stage',
                        ${JSON.stringify(odds)},
                        'quiz'
                    )
                `;
            }
        }

        console.log("Import successfully completed!");
    } catch (e) {
        console.error("Error importing fixtures:", e);
    }
}

run();
