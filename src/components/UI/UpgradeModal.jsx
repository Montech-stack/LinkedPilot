import React, { useState } from 'react';
import { X, Check, Zap, Loader2 } from 'lucide-react';

// ── Plan config (change price here) ─────────────────────────────────────────
const PRO_AMOUNT_KOBO = 500000;   // ₦5,000 in kobo (Paystack uses smallest currency unit)
const PRO_CURRENCY = 'NGN';
const PRO_PRICE_LABEL = '₦5,000';

const FREE_FEATURES = [
    'AI Mind Map generation',
    'All 8 learning modes',
    'Chat with Neuro (unlimited)',
    'Voice input & narration',
    'Quiz generation',
    'Map sharing',
    'Offline access (PWA)',
];

const PRO_FEATURES = [
    'Everything in Free',
    'AI Visualizations — infographics per node',
    'Priority AI responses',
    'More Pro features coming soon',
];

// Dynamically load Paystack inline script (only once)
const loadPaystackScript = () =>
    new Promise((resolve, reject) => {
        if (window.PaystackPop) return resolve();
        const existing = document.getElementById('paystack-inline');
        if (existing) {
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.id = 'paystack-inline';
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });

const UpgradeModal = ({ user, onClose, onSuccess }) => {
    const [status, setStatus] = useState('idle'); // idle | loading | verifying | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleUpgrade = async () => {
        setErrorMsg('');
        setStatus('loading');

        try {
            await loadPaystackScript();
        } catch {
            setErrorMsg('Could not load the payment provider. Check your connection and try again.');
            setStatus('error');
            return;
        }

        setStatus('idle');

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: PRO_AMOUNT_KOBO,
            currency: PRO_CURRENCY,
            ref: `neuro_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            metadata: {
                userId: user.id,
                custom_fields: [
                    { display_name: 'User ID', variable_name: 'userId', value: user.id },
                ],
            },
            onSuccess: async (response) => {
                setStatus('verifying');
                try {
                    const res = await fetch('/api/paystack/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            reference: response.reference,
                            userId: user.id,
                        }),
                    });
                    const data = await res.json();
                    if (data.success) {
                        setStatus('success');
                        setTimeout(() => onSuccess(), 1800);
                    } else {
                        setErrorMsg(data.error || `Verification failed. Save this ref: ${response.reference} and contact support.`);
                        setStatus('error');
                    }
                } catch {
                    setErrorMsg(`Payment received but verification failed. Save this ref: ${response.reference} and contact support.`);
                    setStatus('error');
                }
            },
            onCancel: () => {
                setStatus('idle');
            },
        });

        handler.openIframe();
    };

    const isProcessing = status === 'loading' || status === 'verifying';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '20px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    position: 'relative',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                    animation: 'fadeInUp 0.2s ease-out',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                        borderRadius: '50%', width: '32px', height: '32px',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                    }}
                >
                    <X size={14} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(0,212,255,0.15))',
                        border: '1px solid rgba(124,58,237,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 0 30px rgba(124,58,237,0.2)',
                    }}>
                        <Zap size={26} color="var(--accent-purple)" />
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800',
                        margin: '0 0 8px', color: 'var(--text)',
                    }}>
                        Upgrade to Neuro Pro
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Unlock AI Visualizations and premium features
                    </p>
                </div>

                {/* Plan comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>

                    {/* Free tier */}
                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700',
                            marginBottom: '4px', color: 'var(--text-secondary)', textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>Free</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-secondary)' }}>₦0</div>
                        {FREE_FEATURES.map(f => (
                            <div key={f} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <Check size={10} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--accent-cyan)' }} />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pro tier */}
                    <div style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(0,212,255,0.07))',
                        border: '1px solid rgba(124,58,237,0.45)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        {/* PRO badge */}
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'var(--accent-purple)', color: '#fff',
                            fontSize: '8px', fontWeight: '800', padding: '2px 7px',
                            borderRadius: '8px', fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5px', textTransform: 'uppercase',
                        }}>PRO</div>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700',
                            marginBottom: '4px', color: 'var(--accent-purple)', textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>Pro</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px', color: 'var(--text)' }}>
                            {PRO_PRICE_LABEL}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            one-time · lifetime access
                        </div>
                        {PRO_FEATURES.map(f => (
                            <div key={f} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <Check size={10} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--accent-purple)' }} />
                                <span style={{ fontSize: '11px', color: 'var(--text)', lineHeight: 1.4 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Success state */}
                {status === 'success' && (
                    <div style={{
                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
                        borderRadius: '10px', padding: '14px', marginBottom: '16px',
                        textAlign: 'center', fontSize: '14px', color: '#22c55e', fontWeight: '600',
                    }}>
                        🎉 Welcome to Neuro Pro! Reloading your access...
                    </div>
                )}

                {/* Error state */}
                {status === 'error' && errorMsg && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                        fontSize: '12px', color: '#ef4444', lineHeight: 1.5,
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* CTA Button */}
                <button
                    onClick={handleUpgrade}
                    disabled={isProcessing || status === 'success'}
                    style={{
                        width: '100%', padding: '14px',
                        background: status === 'success'
                            ? 'rgba(34,197,94,0.2)'
                            : 'linear-gradient(135deg, var(--accent-purple), #6366f1, var(--accent-cyan))',
                        backgroundSize: '200% 100%',
                        border: 'none', borderRadius: '12px',
                        color: '#fff', fontFamily: 'var(--font-display)',
                        fontSize: '15px', fontWeight: '700',
                        cursor: isProcessing || status === 'success' ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.75 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                    }}
                >
                    {status === 'loading' && <><Loader2 size={15} className="animate-spin" /> Loading payment...</>}
                    {status === 'verifying' && <><Loader2 size={15} className="animate-spin" /> Verifying payment...</>}
                    {status === 'success' && <>✓ Upgraded!</>}
                    {(status === 'idle' || status === 'error') && <><Zap size={15} /> Upgrade for {PRO_PRICE_LABEL}</>}
                </button>

                <p style={{
                    textAlign: 'center', marginTop: '12px', marginBottom: 0,
                    fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                    Secure payment via Paystack · One-time payment · Instant activation
                </p>
            </div>
        </div>
    );
};

export default UpgradeModal;
