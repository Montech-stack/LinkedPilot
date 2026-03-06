import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

// ── Animated counter hook ──────────────────────────────────────────────
const useCountUp = (target, duration = 1400, start = false) => {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        if (!start || typeof target !== 'number') return;
        const startTime = performance.now();
        const startVal = 0;
        const diff = target - startVal;
        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(startVal + diff * eased);
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration, start]);
    return current;
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ item, index, animate }) => {
    const val = useCountUp(item.value, 1200 + index * 100, animate);
    const display = item.value >= 1000
        ? Math.round(val).toLocaleString()
        : val % 1 === 0 || Math.abs(item.value) >= 10
            ? Math.round(val * 10) / 10
            : Math.round(val * 100) / 100;

    return (
        <div style={{
            background: 'var(--glass)',
            border: `1px solid ${item.color}33`,
            borderRadius: '14px',
            padding: '20px',
            flex: '1 1 140px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`,
        }}>
            <div style={{
                fontSize: 'clamp(28px, 5vw, 38px)',
                fontFamily: 'var(--font-display)',
                fontWeight: '800',
                color: item.color,
                lineHeight: 1,
                textShadow: `0 0 20px ${item.color}55`,
            }}>
                {animate ? display : 0}
                <span style={{ fontSize: '14px', marginLeft: '3px', opacity: 0.8 }}>{item.unit}</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {item.label}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.description}
            </div>
            {/* Glow bar */}
            <div style={{
                height: '2px',
                background: item.color,
                borderRadius: '2px',
                marginTop: '6px',
                boxShadow: `0 0 8px ${item.color}`,
                transform: animate ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: `transform ${0.8 + index * 0.1}s ease-out`,
            }} />
        </div>
    );
};

// ── Stats Renderer ────────────────────────────────────────────────────
const StatsView = ({ data, animate }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {(data.items || []).map((item, i) => (
            <StatCard key={i} item={item} index={i} animate={animate} />
        ))}
    </div>
);

// ── Timeline Renderer ─────────────────────────────────────────────────
const TimelineView = ({ data, animate }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {(data.items || []).map((item, i) => (
            <div
                key={i}
                style={{
                    display: 'flex',
                    gap: '16px',
                    animation: `fadeInUp 0.5s ease-out ${i * 0.12}s backwards`,
                    opacity: animate ? 1 : 0,
                }}
            >
                {/* Line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                    <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: item.color, flexShrink: 0, marginTop: '4px',
                        boxShadow: `0 0 10px ${item.color}`,
                        transition: `box-shadow 0.3s ease ${i * 0.12}s`,
                    }} />
                    {i < (data.items.length - 1) && (
                        <div style={{
                            width: '2px', flex: 1, minHeight: '32px',
                            background: `linear-gradient(to bottom, ${item.color}88, ${data.items[i + 1]?.color}44)`,
                            margin: '4px 0',
                        }} />
                    )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < data.items.length - 1 ? '16px' : 0 }}>
                    <div style={{
                        fontSize: '11px', fontWeight: '700', color: item.color,
                        fontFamily: 'var(--font-mono)', marginBottom: '2px',
                    }}>{item.year}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px', fontFamily: 'var(--font-display)' }}>
                        {item.event}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {item.detail}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// ── Comparison Renderer ───────────────────────────────────────────────
const ComparisonView = ({ data, animate }) => (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[data.sideA, data.sideB].map((side, si) => (
            <div key={si} style={{
                flex: '1 1 200px',
                background: 'var(--glass)',
                border: `1px solid ${side?.color}44`,
                borderRadius: '14px',
                padding: '16px',
                animation: `fadeInUp 0.5s ease-out ${si * 0.15}s backwards`,
            }}>
                <div style={{
                    fontSize: '13px', fontWeight: '800', color: side?.color,
                    fontFamily: 'var(--font-display)', marginBottom: '12px',
                    paddingBottom: '8px', borderBottom: `1px solid ${side?.color}33`,
                }}>
                    {side?.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(side?.points || []).map((pt, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '8px', alignItems: 'flex-start',
                            animation: `fadeInUp 0.4s ease-out ${si * 0.15 + i * 0.08}s backwards`,
                        }}>
                            <span style={{ color: side?.color, flexShrink: 0, fontSize: '13px', marginTop: '1px' }}>•</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pt}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// ── Flow Renderer ─────────────────────────────────────────────────────
const FlowView = ({ data, animate }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(data.steps || []).map((step, i) => (
            <React.Fragment key={i}>
                <div style={{
                    background: 'var(--glass)',
                    border: `1px solid ${step.color}44`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    animation: `fadeInUp 0.5s ease-out ${i * 0.1}s backwards`,
                }}>
                    <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: step.color, color: '#000',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '800', flexShrink: 0,
                        boxShadow: `0 0 10px ${step.color}88`,
                        fontFamily: 'var(--font-display)',
                    }}>
                        {i + 1}
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '3px' }}>
                            {step.label}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {step.detail}
                        </div>
                    </div>
                </div>
                {i < (data.steps.length - 1) && (
                    <div style={{
                        alignSelf: 'center', fontSize: '18px',
                        color: step.color, opacity: 0.6,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.1 + 0.05}s backwards`,
                    }}>↓</div>
                )}
            </React.Fragment>
        ))}
    </div>
);

// ── Main Modal ────────────────────────────────────────────────────────
const VisualizationModal = ({ data, loading, error, onClose, nodeTitle }) => {
    const [animate, setAnimate] = useState(false);
    const overlayRef = useRef(null);

    useEffect(() => {
        if (data) {
            const t = setTimeout(() => setAnimate(true), 100);
            return () => clearTimeout(t);
        }
        setAnimate(false);
    }, [data]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                    <Loader2 size={32} style={{ color: 'var(--accent-cyan)', animation: 'spin 1s linear infinite' }} />
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Generating infographic…</div>
                    {/* Skeleton shimmer */}
                    <div style={{ width: '100%', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                flex: '1 1 140px', height: '110px', borderRadius: '14px',
                                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.15}s`,
                            }} />
                        ))}
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
                    <div style={{ fontSize: '14px' }}>{error}</div>
                </div>
            );
        }

        if (!data) return null;

        const renderers = {
            stats:      <StatsView data={data} animate={animate} />,
            timeline:   <TimelineView data={data} animate={animate} />,
            comparison: <ComparisonView data={data} animate={animate} />,
            flow:       <FlowView data={data} animate={animate} />,
        };

        return renderers[data.type] || null;
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'fadeIn 0.2s ease-out',
            }}
        >
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--glass-border)',
                animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Accent bar */}
                <div style={{
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple), var(--accent-cyan))',
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 4s ease infinite',
                    flexShrink: 0,
                }} />

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '18px 20px 14px',
                    borderBottom: '1px solid var(--glass-border)',
                    flexShrink: 0,
                }}>
                    <div>
                        <div style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase', letterSpacing: '1.5px',
                            color: 'var(--accent-cyan)', marginBottom: '4px',
                        }}>
                            ✦ Pro Visualization
                        </div>
                        <h2 style={{
                            margin: 0, fontSize: '16px', fontWeight: '800',
                            fontFamily: 'var(--font-display)', color: 'var(--text)',
                        }}>
                            {data?.title || nodeTitle}
                        </h2>
                        {data?.subtitle && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {data.subtitle}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', borderRadius: '8px',
                            width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {renderContent()}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(24px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
