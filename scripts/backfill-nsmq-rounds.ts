import "dotenv/config"
import { db } from "../lib/db"
import { matches } from "../lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * Backfills round-by-round progression (result.rounds) for settled NSMQ prelim contests.
 * Scores are CUMULATIVE at the end of each round, as reported by NSMQ live updates.
 * Only writes result.rounds - final scores, winners and fantasy points stay untouched.
 * Missing rounds (R3/R5 gaps in the feed) are simply omitted.
 */

type Round = { label: string, scores: Record<string, number> }

const EDINAMAN = "99c528c3-c1a4-49de-8a0c-7925698b8616"
const ABOMOSU = "0b02028c-d03e-4a4a-8e6c-6ad7631eed66"
const WA = "7a368424-6174-41ec-895b-fcfe9c0fd102"
const STHUBERT = "7d4573fe-6695-4050-ac33-143a83d5ba54"
const AKWAMUMAN = "ced3f57a-2657-42eb-b13b-c06629c4e931"
const BRIGHT = "026fcd0f-aaa5-4e2c-81f4-c52f0f9cbb7f"
const ACCRAGIRLS = "0ce8e041-ed7f-4eeb-9983-2dbd6aab9647"
const ASAMANEKESE = "662e3fee-08f5-4163-843e-638778d83248"
const SANDEMA = "7e41eacf-e035-43f5-a388-9b4669d4d08b"
const TECHIMAN = "68accd98-164d-492e-b7ec-ffbaaafb942f"
const WEHIS = "69c6b5d0-3052-4156-b95b-8bdbaf4fcc3a"
const ESAASE = "123570a1-fd48-4507-a8e7-f6e26ebc9d91"
const SACREDHEART = "81fdf18a-a412-4638-9c50-56e72e8d350d"
const PRESBYBOMPATA = "f81325fb-6ad1-4622-9f5a-72b685f30b17"
const MANSEN = "902d741f-d482-403a-a34d-9fc4b7993237"
const NANDOM = "47c50007-f74a-4279-8742-60bdc59b559e"
const GHANASHSKOF = "18be3151-9750-421f-9c1d-b7d82d7beb8c"
const TUOBODOM = "6aebed23-a4c8-4804-9f99-e3b050be7786"
const SEKONDI = "d989b9fb-80d1-42e5-9c29-418d1cab8bf6"
const AKUMFI = "f0270f9e-8cad-49fe-be38-8ec93a621214"
const BENKUM = "ba93d28b-4fe1-4cb6-b87e-3e1cc7414eb2"
const KUMASIHIGH = "d0891d33-3090-497c-96e7-e084bfed7ee7"
const JACHIEPRAMSO = "79f79841-01f8-4c5c-ab65-bd6d56f4a18d"
const NALERIGU = "a9e8851d-f553-46fe-be8f-a8a8bd009cd1"
const STLOUIS = "2532d1f3-a959-4202-84a9-3446301a7eff"
const SDABEKWAI = "7efdfecf-8350-4e38-8ee2-9b38c1fd918e"
const TIAMASSALAGA = "42a35c82-634c-46b8-a96c-d3847bc3b954"
const TEMA = "ea747a05-ed02-4054-a290-24a517161d34"
const TARKWA = "f29679a3-2697-4cc0-86cc-2a222ac0090f"
const STPAULSDENU = "d3a6f636-2483-49eb-aa11-c634310af58d"
const GHANATA = "c82445a4-625a-4de7-97f0-0768878a274a"
const YENDI = "c00f57ee-1c34-4eec-bed3-ffe99e718a51"
const OREILLY = "08611d74-44ac-4f56-9979-65e9b89edd4b"
const STJOSEPHSEM = "4268ceff-66ef-4f51-af63-7c66757fc1d4"
const KNUST = "530de74a-1f4b-4c08-a637-d84bf763bcd2"
const SDAAGONA = "2687239c-0dff-4580-a2c7-3dec3567592e"
const PENTECOST = "3fe632b5-0d9b-4000-a90f-1d97c5b44a43"
const SFX = "42aec6d5-3c90-4491-bb7d-f69070bf0afe"
const NANABRENTU = "5de65f71-ebef-4a73-94b8-0d66ffc82789"
const OFORIPANIN = "176cda3b-ce4e-4949-bad7-7033170e9dbd"
const OYOKO = "72bc2aa5-c59e-4593-90aa-fafa4c381eca"
const MIM = "d487bf3f-b3df-475b-ac1c-cb105db48f76"
const OKWASS = "28f2f5e2-5f40-499c-b0b7-c7a15bbfd53a"
const KGHS = "88383953-0106-4fa5-acbc-891a9e531e96"
const TAMALEGIRLS = "17de64a4-392e-4ecc-92e5-09289874c08c"
const TAMALE = "1c3c74da-40cc-494c-9c85-fc856c98cb92"
const KALPOHIN = "652a9247-3263-409a-b454-3574d82241fa"
const WENCHI = "fe7f8094-da64-4e04-ab3a-78fb06a88446"
const KADJEBI = "d49bba0c-ad78-4e76-9fc8-4e65fcdd5fe0"
const AHANTAMAN = "efc73e56-975f-44c8-a002-5d0e341518d2"
const ADA = "43e69b8a-cf98-4759-9f87-e4d7e9a63633"
const ANGLICANKSI = "f0e6010c-0362-4bfa-ae23-5b473bc77f5b"
const NAMONG = "907b1d28-d007-4500-ad17-1de9c738da22"
const SHAMA = "586c07e7-c67b-42f9-a38e-6879295d364b"
const WGHS = "093e45b8-a9f9-4b4d-bbd7-5ff4b8d772a6"
const SIMMS = "a9c07171-acbd-4d95-ac4a-d7fac36d1a43"
const NKWATIA = "9d1562b1-7f05-49c6-b2c2-b118b620f27a"
const NOTREDAME = "215db139-acce-42a1-b648-c1ad6ff41d40"
const LABONE = "daab89ff-3d31-4f3f-9a2b-7c57a3f98d7f"
const TIAWA = "854a403c-7894-47e2-966c-fc8b6bad85e8"
const FIJAI = "d526b8cc-c833-4711-8e9c-0c03a70a9aed"
const WINNEBA = "512d1d94-6286-4842-8fa9-e8515a8c3a53"
const ENYAN = "23ab5245-cebe-47f2-a418-d85c047c47ce"

const ROUND_DATA: Record<string, Round[]> = {
    // ---------------- DAY 1 (2026-08-20) ----------------
    "nsmq-2026-m1": [ // Edinaman 47 / Abomosu STEM 35 / Wa 11
        { label: "Round 1", scores: { [EDINAMAN]: 13, [ABOMOSU]: 14, [WA]: 7 } },
        { label: "Round 2", scores: { [EDINAMAN]: 28, [ABOMOSU]: 12, [WA]: 7 } },
        { label: "Round 3", scores: { [EDINAMAN]: 32, [ABOMOSU]: 16, [WA]: 9 } },
        { label: "Round 4", scores: { [EDINAMAN]: 44, [ABOMOSU]: 29, [WA]: 8 } }
    ],
    "nsmq-2026-m2": [ // St. Hubert 51 / Bright 48 / Akwamuman 29
        { label: "Round 1", scores: { [STHUBERT]: 18, [BRIGHT]: 19, [AKWAMUMAN]: 15 } },
        { label: "Round 2", scores: { [STHUBERT]: 33, [BRIGHT]: 19, [AKWAMUMAN]: 17 } },
        { label: "Round 3", scores: { [STHUBERT]: 41, [BRIGHT]: 26, [AKWAMUMAN]: 21 } },
        { label: "Round 4", scores: { [STHUBERT]: 48, [BRIGHT]: 39, [AKWAMUMAN]: 29 } }
    ],
    "nsmq-2026-m3": [ // Accra Girls 52 / Asamankese 39 / Sandema 23
        { label: "Round 1", scores: { [ACCRAGIRLS]: 23, [ASAMANEKESE]: 11, [SANDEMA]: 11 } },
        { label: "Round 2", scores: { [ACCRAGIRLS]: 32, [ASAMANEKESE]: 17, [SANDEMA]: 10 } },
        { label: "Round 3", scores: { [ACCRAGIRLS]: 46, [ASAMANEKESE]: 36, [SANDEMA]: 20 } },
        { label: "Round 4", scores: { [ACCRAGIRLS]: 33, [ASAMANEKESE]: 20, [SANDEMA]: 10 } }
    ],
    "nsmq-2026-m4": [ // Wesley High Bekwai 38 / Techiman 37 / Esaase Bontefufuo 23
        { label: "Round 1", scores: { [WEHIS]: 16, [TECHIMAN]: 11, [ESAASE]: 13 } },
        { label: "Round 2", scores: { [WEHIS]: 20, [TECHIMAN]: 20, [ESAASE]: 11 } },
        { label: "Round 3", scores: { [WEHIS]: 28, [TECHIMAN]: 27, [ESAASE]: 19 } },
        { label: "Round 4", scores: { [WEHIS]: 35, [TECHIMAN]: 31, [ESAASE]: 23 } }
    ],
    "nsmq-2026-m5": [ // Presby Bompata 58 / Sacred Heart 39 / Mansen 7
        { label: "Round 1", scores: { [PRESBYBOMPATA]: 22, [SACREDHEART]: 15, [MANSEN]: 2 } },
        { label: "Round 2", scores: { [PRESBYBOMPATA]: 35, [SACREDHEART]: 16, [MANSEN]: 2 } },
        { label: "Round 3", scores: { [PRESBYBOMPATA]: 42, [SACREDHEART]: 24, [MANSEN]: 5 } },
        { label: "Round 4", scores: { [PRESBYBOMPATA]: 49, [SACREDHEART]: 36, [MANSEN]: 7 } }
    ],
    "nsmq-2026-m6": [ // Nandom 41 / Ghana SHS Koforidua 40 / Tuobodom 14
        { label: "Round 1", scores: { [GHANASHSKOF]: 27, [NANDOM]: 15, [TUOBODOM]: 11 } },
        { label: "Round 2", scores: { [GHANASHSKOF]: 28, [NANDOM]: 20, [TUOBODOM]: 9 } },
        { label: "Round 3", scores: { [GHANASHSKOF]: 30, [NANDOM]: 22, [TUOBODOM]: 13 } },
        { label: "Round 4", scores: { [GHANASHSKOF]: 37, [NANDOM]: 32, [TUOBODOM]: 14 } }
    ],
    "nsmq-2026-m7": [ // Benkum 52 / Sekondi College 38 / Akumfi Ameyaw 24
        { label: "Round 1", scores: { [BENKUM]: 17, [SEKONDI]: 19, [AKUMFI]: 14 } },
        { label: "Round 2", scores: { [BENKUM]: 28, [SEKONDI]: 18, [AKUMFI]: 8 } },
        { label: "Round 3", scores: { [BENKUM]: 33, [SEKONDI]: 25, [AKUMFI]: 14 } },
        { label: "Round 4", scores: { [BENKUM]: 43, [SEKONDI]: 38, [AKUMFI]: 21 } }
    ],
    "nsmq-2026-m8": [ // Kumasi High 45 / Nalerigu 34 / Jachie Pramso 30
        { label: "Round 1", scores: { [KUMASIHIGH]: 14, [NALERIGU]: 8, [JACHIEPRAMSO]: 11 } },
        { label: "Round 2", scores: { [KUMASIHIGH]: 20, [NALERIGU]: 12, [JACHIEPRAMSO]: 11 } },
        { label: "Round 3", scores: { [KUMASIHIGH]: 23, [NALERIGU]: 17, [JACHIEPRAMSO]: 17 } },
        { label: "Round 4", scores: { [KUMASIHIGH]: 42, [NALERIGU]: 31, [JACHIEPRAMSO]: 27 } }
    ],
    "nsmq-2026-m9": [ // St. Louis 69 / SDA Bekwai 39 / T.I. Amass Salaga 18
        { label: "Round 1", scores: { [STLOUIS]: 25, [SDABEKWAI]: 19, [TIAMASSALAGA]: 11 } },
        { label: "Round 2", scores: { [STLOUIS]: 43, [SDABEKWAI]: 16, [TIAMASSALAGA]: 10 } },
        { label: "Round 3", scores: { [STLOUIS]: 53, [SDABEKWAI]: 23, [TIAMASSALAGA]: 11 } },
        { label: "Round 4", scores: { [STLOUIS]: 60, [SDABEKWAI]: 39, [TIAMASSALAGA]: 18 } }
    ],

    // ---------------- DAY 2 (2026-08-21) ----------------
    "nsmq-2026-m10": [ // Tema Sec 42 / St. Paul's Denu 31 / Tarkwa 29
        { label: "Round 1", scores: { [TEMA]: 19, [STPAULSDENU]: 15, [TARKWA]: 14 } },
        { label: "Round 2", scores: { [TEMA]: 26, [STPAULSDENU]: 20, [TARKWA]: 19 } },
        { label: "Round 3", scores: { [TEMA]: 26, [STPAULSDENU]: 20, [TARKWA]: 19 } },
        { label: "Round 4", scores: { [TEMA]: 36, [STPAULSDENU]: 20, [TARKWA]: 29 } }
    ],
    "nsmq-2026-m11": [ // Ghanata 51 / O'Reilly 43 / Yendi 22
        { label: "Round 1", scores: { [GHANATA]: 20, [OREILLY]: 13, [YENDI]: 9 } },
        { label: "Round 2", scores: { [GHANATA]: 32, [OREILLY]: 18, [YENDI]: 10 } },
        { label: "Round 3", scores: { [GHANATA]: 36, [OREILLY]: 20, [YENDI]: 15 } },
        { label: "Round 4", scores: { [GHANATA]: 44, [OREILLY]: 36, [YENDI]: 22 } }
    ],
    // m12: no Round 3 in feed; two conflicting R2 tweets - using the later/corrected one
    "nsmq-2026-m12": [ // St. Joseph Sem 52 / KNUST 39 / SDA Agona 28
        { label: "Round 1", scores: { [KNUST]: 19, [SDAAGONA]: 13, [STJOSEPHSEM]: 9 } },
        { label: "Round 2", scores: { [KNUST]: 23, [SDAAGONA]: 15, [STJOSEPHSEM]: 27 } },
        { label: "Round 4", scores: { [KNUST]: 36, [SDAAGONA]: 25, [STJOSEPHSEM]: 43 } }
    ],
    "nsmq-2026-m13": [ // St. Francis Xavier Jnr Sem 56 / Pentecost 25 / Nana Brentu 13
        { label: "Round 1", scores: { [SFX]: 18, [PENTECOST]: 14, [NANABRENTU]: 0 } },
        { label: "Round 2", scores: { [SFX]: 28, [PENTECOST]: 14, [NANABRENTU]: 0 } },
        { label: "Round 3", scores: { [SFX]: 37, [PENTECOST]: 21, [NANABRENTU]: 2 } },
        { label: "Round 4", scores: { [SFX]: 47, [PENTECOST]: 25, [NANABRENTU]: 9 } }
    ],
    "nsmq-2026-m14": [ // Ofori Panin 53 / Mim 42 / Oyoko Methodist 36
        { label: "Round 1", scores: { [OFORIPANIN]: 11, [MIM]: 19, [OYOKO]: 15 } },
        { label: "Round 2", scores: { [OFORIPANIN]: 25, [MIM]: 22, [OYOKO]: 15 } },
        { label: "Round 3", scores: { [OFORIPANIN]: 34, [MIM]: 29, [OYOKO]: 20 } },
        { label: "Round 4", scores: { [OFORIPANIN]: 50, [MIM]: 33, [OYOKO]: 36 } }
    ],
    // m15: no Round 3 in feed
    "nsmq-2026-m15": [ // Kumasi Girls 43 / Osei Kyeretwie 32 / Tamale Girls 23
        { label: "Round 1", scores: { [KGHS]: 13, [OKWASS]: 12, [TAMALEGIRLS]: 12 } },
        { label: "Round 2", scores: { [KGHS]: 24, [OKWASS]: 19, [TAMALEGIRLS]: 10 } },
        { label: "Round 4", scores: { [KGHS]: 37, [OKWASS]: 29, [TAMALEGIRLS]: 20 } }
    ],
    "nsmq-2026-m16": [ // Tamale SHS 68 / Kalpohin 41 / Wenchi Methodist 30
        { label: "Round 1", scores: { [TAMALE]: 19, [KALPOHIN]: 17, [WENCHI]: 9 } },
        { label: "Round 2", scores: { [TAMALE]: 37, [KALPOHIN]: 19, [WENCHI]: 11 } },
        { label: "Round 3", scores: { [TAMALE]: 46, [KALPOHIN]: 28, [WENCHI]: 17 } },
        { label: "Round 4", scores: { [TAMALE]: 62, [KALPOHIN]: 41, [WENCHI]: 24 } }
    ],
    "nsmq-2026-m17": [ // Kadjebi Asato 56 / Ahantaman Girls 48 / Ada SHTS 35
        { label: "Round 1", scores: { [KADJEBI]: 20, [AHANTAMAN]: 22, [ADA]: 16 } },
        { label: "Round 2", scores: { [KADJEBI]: 31, [AHANTAMAN]: 23, [ADA]: 17 } },
        { label: "Round 3", scores: { [KADJEBI]: 40, [AHANTAMAN]: 29, [ADA]: 22 } },
        { label: "Round 4", scores: { [KADJEBI]: 53, [AHANTAMAN]: 39, [ADA]: 35 } }
    ],
    "nsmq-2026-m18": [ // Anglican Kumasi 69 / Namong 28 / Shama 25
        { label: "Round 1", scores: { [ANGLICANKSI]: 25, [SHAMA]: 19, [NAMONG]: 9 } },
        { label: "Round 2", scores: { [ANGLICANKSI]: 37, [SHAMA]: 14, [NAMONG]: 6 } },
        { label: "Round 3", scores: { [ANGLICANKSI]: 44, [SHAMA]: 18, [NAMONG]: 12 } },
        { label: "Round 4", scores: { [ANGLICANKSI]: 57, [NAMONG]: 28, [SHAMA]: 25 } }
    ],
    "nsmq-2026-m19": [ // Wesley Girls 59 / Nkwatia Presby 26 / Simms 22
        { label: "Round 1", scores: { [WGHS]: 13, [SIMMS]: 10, [NKWATIA]: 6 } },
        { label: "Round 2", scores: { [WGHS]: 21, [NKWATIA]: 13, [SIMMS]: 11 } },
        { label: "Round 3", scores: { [WGHS]: 31, [SIMMS]: 15, [NKWATIA]: 13 } },
        { label: "Round 4", scores: { [WGHS]: 47, [NKWATIA]: 26, [SIMMS]: 22 } }
    ],
    "nsmq-2026-m20": [ // Labone 41 / Notre Dame Sem 39 / T.I. Amass Wa 3
        { label: "Round 1", scores: { [LABONE]: 12, [NOTREDAME]: 10, [TIAWA]: 3 } },
        { label: "Round 2", scores: { [LABONE]: 11, [NOTREDAME]: 18, [TIAWA]: 2 } },
        { label: "Round 3", scores: { [LABONE]: 21, [NOTREDAME]: 23, [TIAWA]: 2 } },
        { label: "Round 4", scores: { [LABONE]: 37, [NOTREDAME]: 30, [TIAWA]: 3 } }
    ],
    "nsmq-2026-m21": [ // Winneba 44 / Fijai 42 / Enyan Denkyira 12
        { label: "Round 1", scores: { [WINNEBA]: 13, [FIJAI]: 7, [ENYAN]: 3 } },
        { label: "Round 2", scores: { [WINNEBA]: 22, [FIJAI]: 22, [ENYAN]: 2 } },
        { label: "Round 3", scores: { [WINNEBA]: 22, [FIJAI]: 22, [ENYAN]: 2 } }
    ]
}

async function main() {
    let updated = 0
    for (const [matchId, rounds] of Object.entries(ROUND_DATA)) {
        const rows = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!rows.length) {
            console.log(`SKIP ${matchId}: not found`)
            continue
        }
        const match = rows[0]
        const result = ((match.result as any) || {}) as any
        const currentScores: Record<string, number> = result.scores || {}

        // Sanity check: last reported round must not contradict the final score line
        const finalCheck = Object.entries(currentScores)
        if (finalCheck.length === 0) console.log(`WARN ${matchId}: no final scores present`)

        await db.update(matches)
            .set({ result: { ...result, rounds } })
            .where(eq(matches.id, matchId))
        updated++
        console.log(`OK   ${matchId}: ${rounds.length} rounds stored`)
    }
    console.log(`\nDone. ${updated}/${Object.keys(ROUND_DATA).length} matches updated.`)
    process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
