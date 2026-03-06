import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

// ── Animated radial ring (for stats) ──────────────────────────────────
const RadialRing = ({ value, max, color, size = 100, strokeWidth = 8, children }) => {
    const [progress, setProgress] = useState(0);
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;

    useEffect(() => {
        const t = setTimeout(() => setProgress(Math.min(100, (value / max) * 100)), 120);
        return () => clearTimeout(t);
    }, [value, max]);

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color})` }}
            />
            <foreignObject x={0} y={0} width={size} height={size} style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}>
                <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {children}
                </div>
            </foreignObject>
        </svg>
    );
};

// ── Animated counter ───────────────────────────────────────────────────
const useCountUp = (target, duration = 1200, delay = 0) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => {
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / duration, 1);
                const e = 1 - Math.pow(1 - p, 3);
                setVal(target * e);
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(t);
    }, [target, duration, delay]);
    return val;
};

// ── Animated bar ───────────────────────────────────────────────────────
const Bar = ({ pct, color, delay = 0 }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), 150 + delay);
        return () => clearTimeout(t);
    }, [pct, delay]);
    return (
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', flex: 1 }}>
            <div style={{
                height: '100%', width: `${width}%`, borderRadius: '6px',
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                boxShadow: `0 0 10px ${color}88`,
                transition: `width 1.2s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
            }} />
        </div>
    );
};

// ── SVG animated line (for flow/timeline) ─────────────────────────────
const DrawLine = ({ x1, y1, x2, y2, color, delay = 0, strokeWidth = 2 }) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const [dash, setDash] = useState(len);
    useEffect(() => {
        const t = setTimeout(() => setDash(0), delay);
        return () => clearTimeout(t);
    }, [delay, len]);
    return (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={len} strokeDashoffset={dash} strokeLinecap="round"
            style={{ transition: `stroke-dashoffset 0.7s ease ${delay}ms`, filter: `drop-shadow(0 0 4px ${color})` }}
        />
    );
};

// ── Single stat card (hook-safe, one per component) ───────────────────
const StatCard = ({ item, index, maxVal }) => {
    const displayed = useCountUp(item.value, 1200, index * 120);
    const fmt = item.value >= 1000
        ? Math.round(displayed).toLocaleString()
        : displayed.toFixed(item.value % 1 !== 0 ? 1 : 0);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`,
            flex: '1 1 120px', maxWidth: '160px',
        }}>
            <RadialRing value={item.value} max={maxVal} color={item.color} size={110} strokeWidth={9}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: item.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {fmt}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.unit}</div>
                </div>
            </RadialRing>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{item.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '3px' }}>{item.description}</div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// RENDERER: Stats — radial rings + animated counters
// ══════════════════════════════════════════════════════════════
const StatsView = ({ data }) => {
    const items = data.items || [];
    const maxVal = Math.max(...items.map(i => i.value), 1);
    return (
        <div>
            {data.subtitle && <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{data.subtitle}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {items.map((item, i) => <StatCard key={i} item={item} index={i} maxVal={maxVal} />)}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// RENDERER: Timeline — horizontal SVG line with animated nodes
// ══════════════════════════════════════════════════════════════
const TimelineView = ({ data }) => {
    const items = data.items || [];
    const [visible, setVisible] = useState(0);

    useEffect(() => {
        let i = 0;
        const tick = () => {
            if (i < items.length) { setVisible(++i); setTimeout(tick, 280); }
        };
        setTimeout(tick, 200);
    }, [items.length]);

    const W = 560;
    const H = 60;
    const pad = 40;
    const step = items.length > 1 ? (W - pad * 2) / (items.length - 1) : 0;

    return (
        <div style={{ overflowX: 'auto' }}>
            {/* SVG spine */}
            <div style={{ minWidth: '500px' }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', marginBottom: '8px' }}>
                    {items.map((item, i) => {
                        if (i === 0) return null;
                        const x1 = pad + (i - 1) * step;
                        const x2 = pad + i * step;
                        return <DrawLine key={i} x1={x1} y1={H / 2} x2={x2} y2={H / 2}
                            color={item.color} delay={i * 280 + 100} strokeWidth={2} />;
                    })}
                    {items.map((item, i) => {
                        const cx = pad + i * step;
                        return (
                            <g key={i}>
                                <circle cx={cx} cy={H / 2} r={visible > i ? 10 : 0} fill={item.color}
                                    style={{ transition: 'r 0.3s ease', filter: `drop-shadow(0 0 8px ${item.color})` }} />
                                <circle cx={cx} cy={H / 2} r={visible > i ? 18 : 0} fill={`${item.color}22`}
                                    style={{ transition: 'r 0.5s ease 0.1s' }} />
                            </g>
                        );
                    })}
                </svg>

                {/* Labels below */}
                <div style={{ display: 'flex', gap: '0' }}>
                    {items.map((item, i) => (
                        <div key={i} style={{
                            flex: 1, textAlign: 'center', padding: '0 4px',
                            opacity: visible > i ? 1 : 0,
                            transform: visible > i ? 'translateY(0)' : 'translateY(8px)',
                            transition: `opacity 0.4s ease ${i * 0.28 + 0.15}s, transform 0.4s ease ${i * 0.28 + 0.15}s`,
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: item.color, fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>{item.year}</div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: '3px' }}>{item.event}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.detail}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// RENDERER: Comparison — animated bar chart face-off
// ══════════════════════════════════════════════════════════════
const ComparisonView = ({ data }) => {
    const { sideA, sideB } = data;
    const points = Math.max((sideA?.points || []).length, (sideB?.points || []).length);
    const rows = Array.from({ length: points });

    return (
        <div>
            {/* Header labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: sideA?.color, fontFamily: 'var(--font-display)' }}>{sideA?.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: sideB?.color, fontFamily: 'var(--font-display)', textAlign: 'right' }}>{sideB?.label}</div>
            </div>

            {/* Bar rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rows.map((_, i) => {
                    const ptA = sideA?.points?.[i];
                    const ptB = sideB?.points?.[i];
                    // Fake relative lengths based on text length as proxy
                    const pctA = ptA ? Math.min(90, 40 + (ptA.length % 4) * 12) : 0;
                    const pctB = ptB ? Math.min(90, 40 + (ptB.length % 4) * 12) : 0;

                    return (
                        <div key={i} style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.1}s backwards` }}>
                            {/* Labels */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '45%' }}>{ptA}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '45%', textAlign: 'right' }}>{ptB}</div>
                            </div>
                            {/* Bars — facing each other from center */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {/* Left bar (right-aligned) */}
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', height: '8px' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '4px 0 0 4px',
                                        background: `linear-gradient(270deg, ${sideA?.color}, ${sideA?.color}88)`,
                                        boxShadow: `0 0 8px ${sideA?.color}66`,
                                        width: '0%',
                                        animation: `growRight ${pctA * 12}ms ease-out ${i * 100 + 200}ms forwards`,
                                    }} style2={{ width: `${pctA}%` }} />
                                </div>
                                <div style={{ width: '2px', height: '18px', background: 'var(--glass-border)', flexShrink: 0 }} />
                                {/* Right bar */}
                                <div style={{ flex: 1, height: '8px' }}>
                                    <Bar pct={pctB} color={sideB?.color} delay={i * 100 + 200} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes growRight {
                    from { width: 0%; }
                    to { width: var(--target-width, 60%); }
                }
            `}</style>
        </div>
    );
};

// Better comparison with actual growing bars from center
const ComparisonViewFixed = ({ data }) => {
    const { sideA, sideB } = data;
    const points = Math.max((sideA?.points || []).length, (sideB?.points || []).length);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: sideA?.color, boxShadow: `0 0 8px ${sideA?.color}` }} />
                    <span style={{ fontSize: '14px', fontWeight: '800', color: sideA?.color, fontFamily: 'var(--font-display)' }}>{sideA?.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: sideB?.color, fontFamily: 'var(--font-display)' }}>{sideB?.label}</span>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: sideB?.color, boxShadow: `0 0 8px ${sideB?.color}` }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Array.from({ length: points }).map((_, i) => {
                    const ptA = sideA?.points?.[i];
                    const ptB = sideB?.points?.[i];
                    const pctA = ptA ? Math.min(95, 55 + ((ptA.charCodeAt(0) + i * 7) % 40)) : 0;
                    const pctB = ptB ? Math.min(95, 55 + ((ptB.charCodeAt(0) + i * 11) % 40)) : 0;

                    return (
                        <div key={i} style={{ animation: `fadeInUp 0.45s ease-out ${i * 0.12}s backwards` }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                                {/* Side A */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, minHeight: '28px' }}>{ptA}</div>
                                    <Bar pct={pctA} color={sideA?.color} delay={i * 120 + 150} />
                                </div>
                                {/* Divider */}
                                <div style={{ width: '1px', background: 'var(--glass-border)', flexShrink: 0 }} />
                                {/* Side B */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, textAlign: 'right', minHeight: '28px' }}>{ptB}</div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Bar pct={pctB} color={sideB?.color} delay={i * 120 + 200} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// RENDERER: Flow — SVG animated connected boxes
// ══════════════════════════════════════════════════════════════
const FlowView = ({ data }) => {
    const steps = data.steps || [];
    const [visible, setVisible] = useState(0);

    useEffect(() => {
        let i = 0;
        const tick = () => {
            if (i < steps.length) { setVisible(++i); setTimeout(tick, 320); }
        };
        setTimeout(tick, 150);
    }, [steps.length]);

    return (
        <div style={{ position: 'relative' }}>
            {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginBottom: i < steps.length - 1 ? '0' : '0' }}>
                    {/* Left: number bubble + connector line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '44px', flexShrink: 0 }}>
                        {/* Number circle */}
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: visible > i ? step.color : 'var(--surface2)',
                            border: `2px solid ${step.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '800', color: visible > i ? '#000' : step.color,
                            fontFamily: 'var(--font-display)',
                            transition: `all 0.4s ease ${i * 0.32}s`,
                            boxShadow: visible > i ? `0 0 16px ${step.color}88` : 'none',
                            flexShrink: 0,
                            zIndex: 1, position: 'relative',
                        }}>
                            {visible > i ? i + 1 : ''}
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                            <div style={{
                                width: '2px',
                                height: visible > i ? '100%' : '0px',
                                minHeight: visible > i ? '40px' : '0px',
                                background: `linear-gradient(to bottom, ${step.color}, ${steps[i + 1]?.color}44)`,
                                transition: `min-height 0.5s ease ${i * 0.32 + 0.2}s`,
                                margin: '4px 0',
                            }} />
                        )}
                    </div>

                    {/* Content card */}
                    <div style={{
                        flex: 1,
                        background: 'var(--glass)',
                        border: `1px solid ${step.color}${visible > i ? '55' : '11'}`,
                        borderRadius: '12px',
                        padding: '12px 14px',
                        marginLeft: '10px',
                        marginBottom: '8px',
                        opacity: visible > i ? 1 : 0,
                        transform: visible > i ? 'translateX(0)' : 'translateX(-12px)',
                        transition: `opacity 0.4s ease ${i * 0.32}s, transform 0.4s ease ${i * 0.32}s, border-color 0.4s ease ${i * 0.32}s`,
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: step.color, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
                            {step.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {step.detail}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN MODAL
// ══════════════════════════════════════════════════════════════
const VisualizationModal = ({ data, loading, error, onClose, nodeTitle }) => {
    const overlayRef = useRef(null);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '40px 0' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle cx="30" cy="30" r="24" fill="none" stroke="var(--accent-cyan)" strokeWidth="4"
                                strokeDasharray="150" strokeLinecap="round"
                                style={{ animation: 'spinDash 1.4s ease-in-out infinite' }} />
                        </svg>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                        Generating infographic…
                    </div>
                    {/* Skeleton bars */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[90, 70, 55, 80].map((w, i) => (
                            <div key={i} style={{
                                height: '10px', borderRadius: '6px',
                                background: `linear-gradient(90deg, var(--glass) 25%, rgba(255,255,255,0.08) 50%, var(--glass) 75%)`,
                                backgroundSize: '200% 100%',
                                animation: `shimmer 1.5s ease-in-out infinite ${i * 0.15}s`,
                                width: `${w}%`,
                            }} />
                        ))}
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                    <div style={{ fontSize: '13px' }}>{error}</div>
                </div>
            );
        }

        if (!data) return null;

        const renderers = {
            stats:      <StatsView data={data} />,
            timeline:   <TimelineView data={data} />,
            comparison: <ComparisonViewFixed data={data} />,
            flow:       <FlowView data={data} />,
        };
        return renderers[data.type] || null;
    };

    const typeLabel = { stats: 'Key Statistics', timeline: 'Timeline', comparison: 'Comparison', flow: 'Process Flow' };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'fadeBgIn 0.25s ease-out',
            }}
        >
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: '22px',
                width: '100%',
                maxWidth: '620px',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 32px 100px rgba(0,0,0,0.6)',
                animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
                {/* Animated accent bar */}
                <div style={{
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple), #f97316, var(--accent-cyan))',
                    backgroundSize: '300% 100%',
                    animation: 'gradient-shift 3s linear infinite',
                    flexShrink: 0,
                }} />

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '16px 20px 14px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0,
                }}>
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            letterSpacing: '1.5px', color: 'var(--accent-purple)', marginBottom: '5px',
                            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                            borderRadius: '6px', padding: '3px 8px',
                        }}>
                            ✦ Pro · {data ? typeLabel[data.type] || 'Infographic' : 'Infographic'}
                        </div>
                        <h2 style={{
                            margin: 0, fontSize: '16px', fontWeight: '800',
                            fontFamily: 'var(--font-display)', color: 'var(--text)',
                        }}>
                            {data?.title || nodeTitle}
                        </h2>
                        {data?.subtitle && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{data.subtitle}</div>
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

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {renderContent()}
                </div>
            </div>

            <style>{`
                @keyframes fadeBgIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes modalIn { from { transform: translateY(20px) scale(0.96); opacity: 0 } to { transform: none; opacity: 1 } }
                @keyframes spinDash {
                    0%   { stroke-dashoffset: 150; stroke-dasharray: 1 149; }
                    50%  { stroke-dashoffset: 0;   stroke-dasharray: 120 30; }
                    100% { stroke-dashoffset: -150; stroke-dasharray: 1 149; }
                }
                @keyframes shimmer {
                    0%   { background-position: 200% 0 }
                    100% { background-position: -200% 0 }
                }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
