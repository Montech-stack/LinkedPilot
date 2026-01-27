
import dns from 'dns';

const hostname = '_mongodb._tcp.ac-pzfdohs.gnx6u31.mongodb.net';

console.log(`Resolving SRV for: ${hostname}`);

dns.resolveSrv(hostname, (err, addresses) => {
    if (err) {
        console.error('❌ DNS Error:', err.code);
        return;
    }

    if (!addresses || addresses.length === 0) {
        console.log('❌ No addresses found.');
        return;
    }

    console.log('✅ Found Shards:');
    addresses.forEach(addr => {
        console.log(`HOST: ${addr.name}`);
        console.log(`PORT: ${addr.port}`);
    });
});
