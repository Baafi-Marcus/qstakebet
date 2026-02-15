import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { db } from "../lib/db";
import { schools, virtualSchoolStats, realSchoolStats, schoolStrengths } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

// 2025 NSMQ Top 100 Schools (Ordered by Rank)
const RANKINGS = [
    "Presbyterian Boys' Senior High, Legon",
    "Prempeh College",
    "Mfantsipim School",
    "Adisadel College",
    "Opoku Ware School",
    "Keta Senior High Technical School (KETASCO)",
    "St Peter's SHS, Nkwatia",
    "St Augustine's College",
    "Accra Academy",
    "St Thomas Aquinas SHS, Accra",
    "University Practice SHS, Cape Coast",
    "Ghana National College, Cape Coast",
    "Wesley Girls' High School",
    "Achimota School",
    "G.S.T.S, Takoradi",
    "Kumasi High School",
    "Tamale SHS (TAMASCO)",
    "Pope John's Seminary, Koforidua",
    "Koforidua Sec. Technical School",
    "KNUST SHS",
    "Mawuli School, Ho",
    "Osei Tutu SHS Akropong",
    "Anglican SHS (KASS) Kumasi",
    "Kumasi Secondary Technical School",
    "Kumasi Academy",
    "St Francis Xavier Jnr Seminary, Wa",
    "Chemu SHS, Tema",
    "Aburi Presby SHTS",
    "St Hubert Seminary, Kumasi",
    "Archbishop Porter Girls’ Secondary, Takoradi",
    "West Africa SHS (WASS), Accra",
    "Ghana SHS, Koforidua (GHANASS)",
    "St Louis SHS, Kumasi",
    "Swedru SHS",
    "Mfantsiman Girls SHS, Saltpond",
    "St James Seminary, Abesim",
    "T.I. AMASS, Kumasi",
    "Holy Child School, Cape Coast",
    "Bishop Herman College, Kpando",
    "Aggrey Memorial SHS, Cape Coast",
    "Krobo Girls, Odumase",
    "Ada SHS",
    "Anlo SHS",
    "Presby SHS, Abetifi",
    "Ola Girls SHS, Ho",
    "Sogakope SHS",
    "Aburi Girls SHS",
    "St John's School Sekondi",
    "New Juaben SHCS",
    "Sunyani SHS",
    "Apam SHS",
    "Osei Kyeretwie SHS (OKESS) Kumasi",
    "Mpraeso SHS",
    "Takoradi SHS (TADISCO)",
    "Armed Forces SHTS Kumasi",
    "Notre Dame Seminary SHS Navrongo",
    "Bolgatanga SHS",
    "St Charles Minor Seminary Tamale",
    "St John's Grammar School, Accra",
    "Boa Amponsem SHS Dunkwa On-Offin",
    "Nifa SHS",
    "Adukrom Amaniampong SHS Mampong",
    "Konongo-Odumase SHS",
    "Awudome SHS Tsito",
    "St Margaret Mary SHS Accra",
    "Abuakwa State College Kyebi",
    "Wesley Grammar School, Accra",
    "Tepa SHS",
    "Ofori Panin SHS Kukurantumi",
    "SDA SHS Bekwai",
    "Kintampo SHS",
    "Ghana SHS Tamale",
    "Assin State College Assin Bereku",
    "Tamale Islamic Science SHS",
    "Mankranso SHS",
    "Akwamuman SHS Atimpoku",
    "Navrongo SHS (NAVASCO)",
    "Adventist SHS Bantama",
    "Techiman SHS",
    "Okuapemman School Akropong",
    "St Mary's SHS, Accra",
    "T.I. AMASS, Fomena",
    "Sonrise SHS, Ho",
    "Ghanata SHS Dodowa",
    "Benkum SHS, Larteh Akuapim",
    "Sekondi College",
    "Nkwatia Presby SHS",
    "Yaa Asantewaa Girls SHS, Kumasi",
    "SIMMS SHS Fawoade",
    "Fijai SHS Sekondi",
    "Winneba SHS",
    "Ashaiman SHS",
    "Our Lady of Mount Carmel Girls SHS, Techiman",
    "Kadjebi-Asato SHS",
    "Northern School of Business Tamale",
    "Osino Presby SHS",
    "St Mary's Boys SHS, Takoradi",
    "Kpando SHS",
    "Oti Boateng SHS, Koforidua",
    "Assin Manso SHS"
];

function getFormModifier(rank: number): number {
    if (rank === 1) return 2.2;
    if (rank <= 5) return 2.0 - ((rank - 2) * 0.1);
    if (rank <= 10) return 1.6 - ((rank - 6) * 0.05);
    if (rank <= 30) return 1.35 - ((rank - 11) * 0.01);
    return 1.15;
}

function getRating(rank: number): number {
    if (rank === 1) return 99;
    if (rank <= 5) return 96 - (rank - 2);
    if (rank <= 10) return 91 - (rank - 6);
    if (rank <= 30) return 86 - (rank - 11) * 0.5;
    return 75;
}

function getVolatility(rank: number): number {
    if (rank <= 10) return 0.03;
    if (rank <= 30) return 0.06;
    return 0.1;
}

async function main() {
    console.log("🚀 Starting NSMQ 2025 AI Strength Integration (Stable Mode)...");

    try {
        const allSchools = await db.select().from(schools);
        console.log(`📊 Total database schools: ${allSchools.length}`);

        let matchCount = 0;

        for (let i = 0; i < RANKINGS.length; i++) {
            const rank = i + 1;
            const rankedName = RANKINGS[i];
            const lowerRanked = rankedName.toLowerCase();

            const matchedSchool = allSchools.find(s => {
                const dbName = s.name.toLowerCase();
                if (dbName === lowerRanked || dbName.includes(lowerRanked) || lowerRanked.includes(dbName)) return true;

                const tokensA = dbName.replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(t => t.length > 2 && !["shs", "shts", "senior", "high", "technical", "school", "college", "practice"].includes(t));
                const tokensB = lowerRanked.replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(t => t.length > 2 && !["shs", "shts", "senior", "high", "technical", "school", "college", "practice"].includes(t));

                const intersect = tokensA.filter(t => tokensB.includes(t));
                if (intersect.length >= 2) return true;
                if (intersect.length === 1 && tokensA.length === 1 && tokensB.length === 1) return true;

                if (lowerRanked.includes("presbyterian boys") && dbName.includes("presec")) return true;
                if (lowerRanked.includes("ketasco") && dbName.includes("keta")) return true;
                if (lowerRanked.includes("kass") && dbName.includes("anglican")) return true;
                if (lowerRanked.includes("ghanass") && (dbName.includes("ghana senior high") || dbName.includes("ghana shs"))) return true;
                if (lowerRanked.includes("okess") && dbName.includes("osei kyeretwie")) return true;
                if (lowerRanked.includes("wadass") && dbName.includes("west africa")) return true;

                return false;
            });

            if (matchedSchool) {
                matchCount++;
                const form = getFormModifier(rank);
                const rating = getRating(rank);
                const volatility = getVolatility(rank);

                console.log(`✅ [${rank}] Matched: ${rankedName} -> ${matchedSchool.name}`);

                try {
                    await db.transaction(async (tx) => {
                        // 1. Virtual Stats (Unique by school_id)
                        const vss = await tx.select().from(virtualSchoolStats).where(eq(virtualSchoolStats.schoolId, matchedSchool.id)).limit(1);
                        if (vss.length > 0) {
                            await tx.update(virtualSchoolStats).set({ currentForm: form, volatilityIndex: volatility, lastUpdated: new Date() }).where(eq(virtualSchoolStats.id, vss[0].id));
                        } else {
                            await tx.insert(virtualSchoolStats).values({
                                id: `vss-${Math.random().toString(36).substr(2, 9)}`,
                                schoolId: matchedSchool.id,
                                currentForm: form,
                                volatilityIndex: volatility
                            });
                        }

                        // 2. Real Stats (Unique by school_id, sport_type, gender)
                        const rss = await tx.select().from(realSchoolStats).where(and(
                            eq(realSchoolStats.schoolId, matchedSchool.id),
                            eq(realSchoolStats.sportType, 'quiz'),
                            eq(realSchoolStats.gender, 'male')
                        )).limit(1);

                        if (rss.length > 0) {
                            await tx.update(realSchoolStats).set({ currentForm: form, lastUpdated: new Date() }).where(eq(realSchoolStats.id, rss[0].id));
                        } else {
                            await tx.insert(realSchoolStats).values({
                                id: `rss-${Math.random().toString(36).substr(2, 9)}`,
                                schoolId: matchedSchool.id,
                                currentForm: form,
                                sportType: 'quiz',
                                gender: 'male'
                            });
                        }

                        // 3. School Strengths (Unique by school_id, sport_type, gender)
                        const str = await tx.select().from(schoolStrengths).where(and(
                            eq(schoolStrengths.schoolId, matchedSchool.id),
                            eq(schoolStrengths.sportType, 'quiz'),
                            eq(schoolStrengths.gender, 'male')
                        )).limit(1);

                        if (str.length > 0) {
                            await tx.update(schoolStrengths).set({ rating: { overall: rating, quiz: rating }, updatedAt: new Date() }).where(eq(schoolStrengths.id, str[0].id));
                        } else {
                            await tx.insert(schoolStrengths).values({
                                id: `str-${Math.random().toString(36).substr(2, 9)}`,
                                schoolId: matchedSchool.id,
                                sportType: 'quiz',
                                gender: 'male',
                                rating: { overall: rating, quiz: rating }
                            });
                        }
                    });
                } catch (txError) {
                    console.error(`❌ Transaction failed for ${matchedSchool.name}:`, (txError as any).message);
                    // Continue to next school
                }
            } else {
                // console.warn(`⚠️ [${rank}] MISS: ${rankedName}`);
            }
        }

        console.log(`\n🎉 DONE! Yield: ${matchCount}/100`);
        process.exit(0);
    } catch (e) {
        console.error("❌ FATAL ERROR:");
        console.error(e);
        process.exit(1);
    }
}

main();
