import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { reference, userId } = req.body || {};

    if (!reference || !userId) {
        return res.status(400).json({ error: 'Missing reference or userId' });
    }

    // Strict validation — alphanumeric + hyphens/underscores only
    if (!/^[a-zA-Z0-9_-]{5,100}$/.test(reference)) {
        return res.status(400).json({ error: 'Invalid reference format' });
    }
    if (!/^[0-9a-f-]{36}$/.test(userId)) {
        return res.status(400).json({ error: 'Invalid userId format' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ error: 'Payment service not configured' });
    }

    try {
        // ── 1. Verify with Paystack API (server-to-server) ──────────────────
        const paystackRes = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!paystackRes.ok) {
            return res.status(400).json({ error: 'Could not verify transaction with Paystack' });
        }

        const paystackData = await paystackRes.json();
        const txn = paystackData.data;

        if (!txn || txn.status !== 'success') {
            return res.status(400).json({ error: 'Transaction not successful', status: txn?.status });
        }

        // ── 2. Check metadata userId matches the requesting user ────────────
        const metaUserId = txn.metadata?.userId;
        if (metaUserId && metaUserId !== userId) {
            return res.status(403).json({ error: 'User mismatch in transaction metadata' });
        }

        // ── 3. Update Supabase profile using service role (bypasses RLS) ────
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return res.status(500).json({ error: 'Database service not configured' });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false },
        });

        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                is_pro: true,
                upgraded_at: new Date().toISOString(),
                paystack_ref: reference,
            });

        if (dbError) {
            console.error('Supabase upsert error:', dbError);
            return res.status(500).json({ error: 'Could not update profile' });
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Verify endpoint error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
