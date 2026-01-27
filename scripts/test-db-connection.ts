
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env');
const env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.log('RESULT: FAILED_NO_URI');
    process.exit(1);
}

console.log('TEST_STARTED_WITH_FAMILY_4');

async function testConnection() {
    try {
        await mongoose.connect(MONGODB_URI!, {
            dbName: 'Linkedpilot',
            bufferCommands: false,
            connectTimeoutMS: 10000,
            family: 4 // Force IPv4
        });
        console.log('RESULT: SUCCESS');
        await mongoose.disconnect();
    } catch (error: any) {
        console.log('RESULT: FAILED_CONNECTION');
        console.log('ERROR_NAME:', error.name);
        console.log('ERROR_MESSAGE:', error.message);
    }
}

testConnection();
