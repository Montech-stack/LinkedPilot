
import fs from 'fs';
import path from 'path';
import https from 'https';

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

async function testImagen(modelName: string) {
    console.log(`\nTesting REST API for: ${modelName}`);

    // Imagen uses :predict usually
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${API_KEY}`;

    const payload = {
        instances: [
            { prompt: "A futuristic city with flying cars, cyberpunk style" }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "1:1" // or "1:1"
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log("Response preview:", text.substring(0, 500));

        if (response.ok) {
            const data = JSON.parse(text);
            if (data.predictions && data.predictions.length > 0) {
                console.log("✅ Success! Got prediction/image.");
                // Usually returns base64 in bytesBase64Encoded or similar
                const pred = data.predictions[0];
                const b64 = pred.bytesBase64Encoded || pred.image?.bytesBase64Encoded;
                if (b64) console.log("Has Base64 data length:", b64.length);
                else console.log("Prediction keys:", Object.keys(pred));
            }
        }
    } catch (e: any) {
        console.error("fetch error:", e.message);
    }
}

async function run() {
    // Try reliable Imagen names
    await testImagen("imagen-3.0-generate-001");
    // await testImagen("imagen-4.0-generate-preview-06-06"); // Only if you have access
}

run();
