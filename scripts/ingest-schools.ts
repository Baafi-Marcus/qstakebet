import "dotenv/config";
import { db } from "../lib/db";
import { schools } from "../lib/db/schema";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function ingestSchools() {
    // Manually load .env if dotenv/config doesn't work automatically or for double safety
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not defined in environment variables. Ensure .env file exists and is loaded.");
        // Try loading from .env.local as well if needed, but .env is standard
    }

    const filePath = path.join(process.cwd(), "School Name,Region.txt");

    console.log(`Reading file from: ${filePath}`);

    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n").filter(line => line.trim() !== "");

        // Skip header if it exists (School Name,Region)
        const dataLines = lines[0].toLowerCase().includes("school name") ? lines.slice(1) : lines;

        const schoolRecords = [];

        console.log(`Found ${dataLines.length} lines to process.`);

        for (const line of dataLines) {
            // Handle simple CSV splitting, respecting potential quotes
            // Regex to match: "Value 1",Value 2  OR  Value 1,Value 2
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");

            // Fallback split if regex fails or simple structure
            let [name, region] = line.split(",").map(s => s.trim());

            // Handle quoted names like "School, Name"
            if (line.includes('"')) {
                const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                if (parts && parts.length >= 2) {
                    name = parts[0].replace(/"/g, "").trim();
                    region = parts[parts.length - 1].replace(/"/g, "").trim();
                } else {
                    // Last resort manual parse
                    const lastCommaIndex = line.lastIndexOf(",");
                    name = line.substring(0, lastCommaIndex).replace(/"/g, "").trim();
                    region = line.substring(lastCommaIndex + 1).replace(/"/g, "").trim();
                }
            }

            if (name && region) {
                schoolRecords.push({
                    id: crypto.randomUUID(),
                    name: name,
                    region: region,
                    gender: name.toLowerCase().includes("girls") ? "female" : name.toLowerCase().includes("boys") ? "male" : "mixed",
                    category: "A", // Default
                    location: region,
                    district: "Unknown"
                });
            }
        }

        console.log(`Parsed ${schoolRecords.length} valid school records.`);

        if (schoolRecords.length > 0) {
            console.log("Clearing existing schools table...");
            await db.delete(schools);

            console.log("Inserting new records...");
            // Batch insert to avoid huge query
            const batchSize = 100;
            for (let i = 0; i < schoolRecords.length; i += batchSize) {
                const batch = schoolRecords.slice(i, i + batchSize);
                await db.insert(schools).values(batch);
                console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
            }

            console.log("Ingestion complete!");
        } else {
            console.warn("No records found to insert.");
        }

    } catch (error) {
        console.error("Error ingesting schools:", error);
    }

    process.exit(0);
}

ingestSchools();
