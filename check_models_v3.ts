
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
const KEY = env.GEMINI_IMAGE_KEY;
if (!KEY) { console.log("No Key"); process.exit(0); }

async function check() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`);
    const data = await response.json();
    (data.models || []).forEach((m: any) => {
        if (m.name.includes('imagen')) console.log(`${m.name} | Methods: ${m.supportedGenerationMethods}`);
    });
}
check();
