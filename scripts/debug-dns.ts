
import dns from 'dns';
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

const uri = env.MONGODB_URI;
if (!uri) {
    console.error("No MONGODB_URI found");
    process.exit(1);
}

// Extract hostname from mongodb+srv://<user>:<pass>@<hostname>/...
const match = uri.match(/@([^/?]+)/);
if (!match) {
    console.log("Could not parse hostname from URI. Ensure it is in mongodb+srv:// format.");
    console.log("URI starts with:", uri.substring(0, 15) + "...");
    process.exit(0);
}

const hostname = match[1];
console.log(`Checking DNS for hostname: ${hostname}`);
console.log(`Looking up SRV record for: _mongodb._tcp.${hostname}`);

dns.resolveSrv(`_mongodb._tcp.${hostname}`, (err, addresses) => {
    if (err) {
        console.error("\n❌ DNS Lookup Failed!");
        console.error(`Code: ${err.code}`);
        console.error(`Message: ${err.message}`);
        console.error("\nPossible Causes:");
        console.error("1. The hostname is incorrect.");
        console.error("2. You are on a restricted network (corporate VPN, firewall blocking DNS).");
        console.error("3. The MongoDB Atlas cluster 'paused' or does not exist.");
    } else {
        console.log("\n✅ DNS Lookup Successful!");
        console.log("Addresses found:", addresses);
        console.log("\nIf connection still fails, it is likely an IP Whitelist issue or Authentication error.");
    }
});
