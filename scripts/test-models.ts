import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function run() {
    try {
        console.log("Fetching models with key:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
        
        // Use standard REST API directly to fetch list of models
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

run();
