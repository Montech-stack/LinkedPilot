
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env');
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('#')) {
                env[key] = val;
            }
        }
    });
}

const API_KEY = env.GEMINI_IMAGE_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_IMAGE_KEY is missing in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName: string) {
    console.log(`\nTesting model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Simple prompt
        const result = await model.generateContent("Generate a cute image of a robot cat.");
        const response = await result.response;
        
        console.log(`Response status: OK`);
        
        // Check for candidates
        const candidates = (response as any).candidates;
        if (candidates && candidates.length > 0) {
            const part = candidates[0].content?.parts?.[0];
            if (!part) {
                 console.log("Empty part.");
                 return;
            }

            if (part.text) {
                console.log("Output: TEXT");
                console.log("preview:", part.text.substring(0, 100));
            } else if (part.inlineData) {
                console.log("Output: IMAGE (inlineData)");
                console.log("MimeType:", part.inlineData.mimeType);
            } else {
                console.log("Output: Unknown part type", JSON.stringify(part));
            }
        } else {
            console.log("No candidates returned.");
        }
        
    } catch (e: any) {
        console.error(`❌ Error with ${modelName}:`, e.message);
    }
}

async function run() {
    // 1. Try the one we used
    await testModel("gemini-2.5-flash-image");
    
    // 2. Try an Imagen model - Note: SDK might not support "imagen-" via generateContent, but let's try.
    // If it fails, I'll try constructing the payload manually for the REST API in a separate step.
    await testModel("imagen-3.0-generate-001");
}

run();
