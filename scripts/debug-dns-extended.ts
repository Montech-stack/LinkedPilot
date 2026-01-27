
import dns from 'dns';

const MONGO_HOST = '_mongodb._tcp.ac-pzfdohs.gnx6u31.mongodb.net';
const CONTROL_HOST = 'google.com';

console.log('--- EXTENDED DNS DEBUG ---');

// 1. Check Control Host (System DNS)
console.log(`\n1. Resolving ${CONTROL_HOST} (System DNS)...`);
dns.resolve4(CONTROL_HOST, (err, addresses) => {
    if (err) console.log(`❌ Failed: ${err.message}`);
    else console.log(`✅ Success: ${addresses}`);

    // 2. Check Mongo Host (System DNS)
    console.log(`\n2. Resolving ${MONGO_HOST} (System DNS)...`);
    dns.resolveSrv(MONGO_HOST, (err, addresses) => {
        if (err) console.log(`❌ Failed: ${err.message}`);
        else console.log(`✅ Success: Found ${addresses.length} records`);

        // 3. Check Control Host (Google DNS)
        console.log(`\n3. Switching to Google DNS (8.8.8.8)...`);
        try {
            dns.setServers(['8.8.8.8']);
            console.log(`   Servers set to: ${dns.getServers()}`);
        } catch (e: any) {
            console.log(`   Warning: Could not set servers: ${e.message}`);
        }

        console.log(`\n4. Resolving ${CONTROL_HOST} (Google DNS)...`);
        dns.resolve4(CONTROL_HOST, (err, addresses) => {
            if (err) console.log(`❌ Failed: ${err.message}`);
            else console.log(`✅ Success: ${addresses}`);

            // 4. Check Mongo Host (Google DNS)
            console.log(`\n5. Resolving ${MONGO_HOST} (Google DNS)...`);
            dns.resolveSrv(MONGO_HOST, (err, addresses) => {
                if (err) console.log(`❌ Failed: ${err.message}`);
                else console.log(`✅ Success: Found ${addresses.length} records`);
                console.log('\n--- END ---');
            });
        });
    });
});
