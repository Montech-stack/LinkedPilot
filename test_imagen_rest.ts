
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}
const API_KEY = env.GEMINI_IMAGE_KEY;
if (!API_KEY) { console.log("No Key"); process.exit(0); }

async function tryModel(name: string) {
    console.log(`Testing ${name}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/${name}:predict?key=${API_KEY}`;
    const payload = {
        instances: [{ prompt: "A robot cat" }],
        parameters: { sampleCount: 1 }
    };
    try {
        const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
        console.log(`Status: ${res.status}`);
        if (res.ok) console.log("SUCCESS");
        else console.log(await res.text());
    } catch (e: any) { console.log(e.message); }
}

async function run() {
    await tryModel("models/imagen-4.0-generate-001");
}

run();
