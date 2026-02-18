import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read .env manually since dotenv might not be installed
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!API_KEY) {
    console.error("No API Key found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        const modelResponse = await genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy init to access client? 
        // Actually the SDK might not expose listModels directly on the instance easily without looking up docs.
        // Wait, the error message said "Call ListModels".
        // I should check if the SDK has a listModels method? 
        // Looking at common usage: usually `genAI.getGenerativeModel` is main entry.
        // There might not be a `listModels` method on the `genAI` instance in the JS SDK?
        // Let's try to just fetch the list using REST if SDK fails or check SDK docs.
        // SDK usually has a ModelService or similar? 
        // Actually, `GoogleGenerativeAI` class doesn't seem to have `listModels`.
        // It might be better to just try `gemini-1.5-pro-latest` or `gemini-pro`.

        // However, I can try to use `fetch` to call the API directly to list models.
        console.log("Listing models via REST API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
