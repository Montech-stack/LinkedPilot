import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return res.status(500).json({ error: 'Payment service not configured' });
    }

    // ── Verify Paystack webhook signature ────────────────────────────────
    const signature = req.headers['x-paystack-signature'];
    const hash = crypto
        .createHmac('sha512', secretKey)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (hash !== signature) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    // Only handle successful charge events
    if (event !== 'charge.success') {
        return res.status(200).json({ message: 'Event ignored' });
    }

    const userId = data?.metadata?.userId;
    if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
        return res.status(200).json({ message: 'No valid userId in metadata' });
    }

    try {
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
        );

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                is_pro: true,
                upgraded_at: new Date().toISOString(),
                paystack_ref: data.reference,
            });

        if (error) {
            console.error('Webhook Supabase error:', error);
            return res.status(500).json({ error: 'Could not update profile' });
        }

        return res.status(200).json({ message: 'Profile upgraded' });

    } catch (err) {
        console.error('Webhook error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
