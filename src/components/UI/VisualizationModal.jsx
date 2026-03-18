import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

// ── Animated counter ────────────────────────────────────────────────────
const useCountUp = (target, active, duration = 2000) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!active) { setVal(0); return; }
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const e = 1 - Math.pow(1 - p, 4);
            setVal(target * e);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, active, duration]);
    return val;
};

const fmtStat = (val, unit) => {
    const u = (unit || '').toLowerCase();
    if (u.includes('billion') || u === 'b') return (val / 1e9).toFixed(2) + 'B';
    if (u.includes('million') || u === 'm') return (val / 1e6).toFixed(1) + 'M';
    if (u.includes('trillion') || u === 't') return (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (val >= 1000) return Math.round(val).toLocaleString();
    return Number.isInteger(val) ? val : val.toFixed(1);
};

// ── Word-by-word reveal ─────────────────────────────────────────────────
const WordReveal = ({ text, enter, baseDelay = 0, color = '#fff', style = {} }) => (
    <span style={style}>
        {(text || '').split(' ').map((word, i) => (
            <span key={i} style={{
                display: 'inline-block', marginRight: '0.28em',
                opacity: enter ? 1 : 0,
                transform: enter ? 'none' : 'translateY(10px)',
                transition: `opacity 0.35s ease ${baseDelay + i * 0.055}s, transform 0.35s ease ${baseDelay + i * 0.055}s`,
                color,
            }}>{word}</span>
        ))}
    </span>
);

// ── Floating particles ──────────────────────────────────────────────────
const ParticleField = ({ accent }) => {
    const particles = useMemo(() => [
        { x: 8,  y: 15, s: 80,  dur: 6,   del: 0    },
        { x: 85, y: 10, s: 50,  dur: 8,   del: -2   },
        { x: 70, y: 75, s: 100, dur: 7,   del: -1.5 },
        { x: 20, y: 70, s: 60,  dur: 9,   del: -3   },
        { x: 50, y: 5,  s: 40,  dur: 5,   del: -0.8 },
        { x: 92, y: 50, s: 70,  dur: 10,  del: -4   },
        { x: 35, y: 90, s: 45,  dur: 7.5, del: -2.5 },
    ], []);
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {particles.map((p, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    left: `${p.x}%`, top: `${p.y}%`,
                    width: p.s, height: p.s,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)`,
                    animation: `particle${i % 3} ${p.dur}s ease-in-out ${p.del}s infinite`,
                    willChange: 'transform',
                }} />
            ))}
        </div>
    );
};

// ── Scan-line reveal for cards ──────────────────────────────────────────
const ScanReveal = ({ accent, active }) => (
    <div style={{
        position: 'absolute', inset: 0, borderRadius: '10px',
        overflow: 'hidden', pointerEvents: 'none',
    }}>
        <div style={{
            position: 'absolute', left: 0, right: 0, height: '2px',
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 20px ${accent}`,
            top: active ? '100%' : '-2px',
            transition: active ? 'top 0.7s ease 0.15s' : 'none',
        }} />
    </div>
);

// ══════════════════════════════════════════════════════════════════════
// SCENE RENDERERS
// ══════════════════════════════════════════════════════════════════════

const IntroScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', textAlign: 'center', padding: '28px', position: 'relative' }}>
        <ParticleField accent={scene.accent} />

        {/* Expanding rings */}
        {[1, 2, 3].map(i => (
            <div key={i} style={{
                position: 'absolute',
                width: `${i * 110}px`, height: `${i * 110}px`,
                borderRadius: '50%',
                border: `1px solid ${scene.accent}`,
                opacity: enter ? (0.18 - i * 0.05) : 0,
                transform: enter ? 'scale(1)' : 'scale(0.2)',
                transition: `transform ${0.9 + i * 0.2}s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s, opacity 0.6s ease ${i * 0.08}s`,
                animation: enter ? `ringPulse ${2.5 + i * 0.4}s ease-in-out ${i * 0.4}s infinite` : 'none',
            }} />
        ))}

        <div style={{
            fontSize: '64px', lineHeight: 1, position: 'relative', zIndex: 1,
            filter: `drop-shadow(0 0 28px ${scene.accent})`,
            transform: enter ? 'scale(1)' : 'scale(0.2)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            animation: enter ? 'iconFloat 3s ease-in-out 0.7s infinite' : 'none',
        }}>{scene.icon}</div>

        <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: '900',
            fontSize: 'clamp(22px, 5vw, 40px)', lineHeight: 1.1, color: '#fff', margin: 0,
            background: `linear-gradient(135deg, #fff 30%, ${scene.accent} 70%)`,
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: enter ? 'gradShift 4s ease infinite' : 'none',
            opacity: enter ? 1 : 0,
            transform: enter ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s',
            position: 'relative', zIndex: 1,
        }}>{scene.headline}</h1>

        <p style={{
            fontSize: 'clamp(13px, 2.2vw, 16px)', color: 'rgba(255,255,255,0.6)',
            maxWidth: '420px', lineHeight: 1.75, margin: 0,
            opacity: enter ? 1 : 0,
            transform: enter ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s',
            position: 'relative', zIndex: 1,
        }}>{scene.subtext}</p>
    </div>
);

const ContextScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '14px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        {/* Big decorative letter in corner */}
        <div style={{
            position: 'absolute', right: '-10px', bottom: '-20px',
            fontSize: '180px', fontFamily: 'var(--font-display)', fontWeight: '900',
            color: `${scene.accent}08`, lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            transform: enter ? 'translateX(0)' : 'translateX(60px)',
            transition: 'transform 1s ease 0.2s',
        }}>?</div>

        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', position: 'relative',
            opacity: enter ? 1 : 0, transform: enter ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
            <span style={{ fontSize: '28px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(16px, 3.5vw, 24px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>

        {scene.body && (
            <p style={{
                fontSize: 'clamp(12px, 2vw, 14px)', color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.75, margin: 0, position: 'relative',
                opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(12px)',
                transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
            }}>{scene.body}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            {(scene.bullets || []).map((b, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateX(-20px)',
                    transition: `opacity 0.45s ease ${0.28 + i * 0.14}s, transform 0.45s ease ${0.28 + i * 0.14}s`,
                }}>
                    <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                        background: scene.accent, marginTop: '6px',
                        boxShadow: `0 0 10px ${scene.accent}`,
                        animation: enter ? `dotGlow 2s ease-in-out ${i * 0.3}s infinite` : 'none',
                    }} />
                    <span style={{ fontSize: 'clamp(12px, 2.2vw, 14px)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.65 }}>{b}</span>
                </div>
            ))}
        </div>
    </div>
);

const TimelineScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px 36px', gap: '10px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(-12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            position: 'relative',
        }}>
            <span style={{ fontSize: '24px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(15px, 3vw, 21px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', paddingLeft: '28px' }}>
            {/* Animated vertical line */}
            <div style={{
                position: 'absolute', left: '10px', top: '6px', width: '2px',
                background: `linear-gradient(to bottom, ${scene.accent}, ${scene.accent}22)`,
                height: enter ? 'calc(100% - 6px)' : '0%',
                transition: 'height 0.9s cubic-bezier(0.4,0,0.2,1) 0.2s',
                borderRadius: '1px',
            }} />

            {(scene.events || []).map((ev, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    opacity: enter ? 1 : 0,
                    transition: `opacity 0.4s ease ${0.35 + i * 0.22}s`,
                    position: 'relative',
                }}>
                    {/* Dot on the line */}
                    <div style={{
                        position: 'absolute', left: '-22px', top: '5px',
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: scene.accent,
                        boxShadow: `0 0 0 3px #07070e, 0 0 0 5px ${scene.accent}44, 0 0 14px ${scene.accent}`,
                        transform: enter ? 'scale(1)' : 'scale(0)',
                        transition: `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.4 + i * 0.22}s`,
                    }} />
                    <div>
                        <span style={{
                            display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)',
                            color: scene.accent, letterSpacing: '0.5px', marginBottom: '2px',
                            fontWeight: '700',
                        }}>{ev.year}</span>
                        <span style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>{ev.event}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StatScene = ({ scene, enter }) => {
    const raw = scene.stat?.value || 0;
    const unit = scene.stat?.unit || '';
    const val = useCountUp(raw, enter);
    const displayed = fmtStat(val, unit);
    const displayedUnit = unit.replace(/billion|million|trillion/gi, '').trim();
    const r = 58;
    const circ = 2 * Math.PI * r;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', textAlign: 'center', padding: '28px', position: 'relative' }}>
            <ParticleField accent={scene.accent} />

            {/* Animated SVG ring */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="140" height="140" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r={r} fill="none" stroke={`${scene.accent}18`} strokeWidth="5" />
                    <circle cx="70" cy="70" r={r} fill="none" stroke={scene.accent} strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={enter ? 0 : circ}
                        style={{ transition: `stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1) 0.15s`, filter: `drop-shadow(0 0 8px ${scene.accent})` }}
                    />
                    {/* Spinning outer ring */}
                    <circle cx="70" cy="70" r={r + 14} fill="none"
                        stroke={`${scene.accent}22`} strokeWidth="1.5"
                        strokeDasharray="4 12" strokeLinecap="round"
                        style={{ animation: enter ? 'spinRing 8s linear infinite' : 'none' }}
                    />
                </svg>

                <div style={{ fontSize: '36px', position: 'relative', zIndex: 1 }}>{scene.icon}</div>
            </div>

            <div style={{
                fontFamily: 'var(--font-display)', fontWeight: '900',
                fontSize: 'clamp(48px, 10vw, 80px)', lineHeight: 1, letterSpacing: '-2px',
                color: scene.accent,
                textShadow: `0 0 50px ${scene.accent}66, 0 0 100px ${scene.accent}22`,
                transform: enter ? 'scale(1)' : 'scale(0.5)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s, opacity 0.5s ease 0.1s',
            }}>
                {displayed}
                {displayedUnit && <span style={{ fontSize: '0.38em', opacity: 0.75, letterSpacing: 0 }}>{displayedUnit}</span>}
            </div>

            <div style={{
                fontSize: 'clamp(13px, 2.8vw, 18px)', fontWeight: '700',
                color: '#fff', fontFamily: 'var(--font-display)',
                opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(14px)',
                transition: 'opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s',
            }}>{scene.headline}</div>

            <p style={{
                fontSize: 'clamp(11px, 2vw, 13px)', color: 'rgba(255,255,255,0.5)',
                maxWidth: '360px', lineHeight: 1.75, margin: 0,
                opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(10px)',
                transition: 'opacity 0.5s ease 0.55s, transform 0.5s ease 0.55s',
            }}>{scene.subtext}</p>
        </div>
    );
};

const StepsScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '20px 36px', gap: '10px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px',
            opacity: enter ? 1 : 0, transition: 'opacity 0.5s ease',
            position: 'relative',
        }}>
            <span style={{ fontSize: '24px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(15px, 3vw, 21px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
            {/* Connecting line behind steps */}
            <div style={{
                position: 'absolute', left: '11px', top: '24px',
                width: '2px',
                background: `linear-gradient(to bottom, ${scene.accent}55, transparent)`,
                height: enter ? `calc(100% - 36px)` : '0%',
                transition: 'height 0.7s ease 0.3s',
            }} />

            {(scene.steps || []).map((step, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateX(-20px)',
                    transition: `opacity 0.4s ease ${0.2 + i * 0.18}s, transform 0.4s ease ${0.2 + i * 0.18}s`,
                }}>
                    {/* Numbered circle with spinning ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <svg width="24" height="24" style={{ position: 'absolute', inset: '-3px', animation: enter ? `spinRing ${4 + i}s linear infinite` : 'none' }}>
                            <circle cx="15" cy="15" r="12" fill="none"
                                stroke={`${scene.accent}55`} strokeWidth="1.5"
                                strokeDasharray="5 8" strokeLinecap="round" />
                        </svg>
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: scene.accent, color: '#000',
                            fontWeight: '900', fontSize: '11px', fontFamily: 'var(--font-display)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 14px ${scene.accent}66`,
                            transform: enter ? 'scale(1)' : 'scale(0)',
                            transition: `transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.25 + i * 0.18}s`,
                        }}>{i + 1}</div>
                    </div>
                    <span style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, paddingTop: '4px' }}>{step}</span>
                </div>
            ))}
        </div>
    </div>
);

const FactScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '16px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        {/* Decorative accent bar */}
        <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
            background: `linear-gradient(to bottom, transparent, ${scene.accent}, transparent)`,
            opacity: enter ? 1 : 0, transition: 'opacity 0.6s ease',
        }} />

        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', position: 'relative',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateX(-20px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
            <span style={{ fontSize: '28px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(16px, 3.5vw, 24px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', position: 'relative' }}>
            {(scene.bullets || []).map((b, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateX(-24px)',
                    transition: `opacity 0.45s ease ${0.2 + i * 0.14}s, transform 0.45s ease ${0.2 + i * 0.14}s`,
                }}>
                    <div style={{
                        flexShrink: 0, marginTop: '6px',
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: scene.accent, boxShadow: `0 0 10px ${scene.accent}`,
                        animation: enter ? `dotGlow 2.5s ease-in-out ${i * 0.4}s infinite` : 'none',
                    }} />
                    <span style={{ fontSize: 'clamp(12px, 2.2vw, 14px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.65 }}>{b}</span>
                </div>
            ))}
        </div>
    </div>
);

const ExampleScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '14px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', position: 'relative',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(-12px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
            <span style={{ fontSize: '26px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(14px, 3vw, 20px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>

        <div style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, ${scene.accent}0a 100%)`,
            border: `1px solid ${scene.accent}33`,
            borderLeft: `3px solid ${scene.accent}`,
            borderRadius: '10px', padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            position: 'relative', overflow: 'hidden',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(20px) scale(0.97)',
            transition: 'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s',
        }}>
            <ScanReveal accent={scene.accent} active={enter} />
            <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: scene.accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    What Happened
                </div>
                <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.72, margin: 0 }}>
                    {scene.case}
                </p>
            </div>
            <div style={{ borderTop: `1px solid ${scene.accent}22`, paddingTop: '12px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: scene.accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    The Result
                </div>
                <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.88)', lineHeight: 1.72, margin: 0, fontWeight: '600' }}>
                    {scene.result}
                </p>
            </div>
        </div>
    </div>
);

const QuoteScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '36px 44px', gap: '18px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        {/* Large animated quote mark */}
        <div style={{
            fontSize: '120px', lineHeight: 1, color: scene.accent, fontFamily: 'Georgia, serif',
            position: 'absolute', top: '-10px', left: '20px', opacity: 0.08,
            transform: enter ? 'scale(1) rotate(-5deg)' : 'scale(0.3) rotate(-30deg)',
            transition: 'transform 0.9s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease',
            opacity: enter ? 0.1 : 0,
            pointerEvents: 'none',
        }}>"</div>

        {/* Small accent quote */}
        <div style={{
            fontSize: '48px', lineHeight: 1, color: scene.accent, fontFamily: 'Georgia, serif',
            opacity: enter ? 0.6 : 0,
            transform: enter ? 'translateY(0)' : 'translateY(-14px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
        }}>"</div>

        <blockquote style={{
            fontFamily: 'var(--font-display)', fontWeight: '600',
            fontSize: 'clamp(14px, 3vw, 21px)', color: '#fff',
            lineHeight: 1.65, margin: 0, fontStyle: 'italic',
            textShadow: `0 0 50px ${scene.accent}33`,
            position: 'relative', zIndex: 1,
        }}>
            <WordReveal text={scene.quote} enter={enter} baseDelay={0.2} />
        </blockquote>

        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(10px)',
            transition: 'opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s',
        }}>
            <div style={{ width: '28px', height: '1px', background: scene.accent, opacity: 0.6 }} />
            <span style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: scene.accent, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
                {scene.attribution}
            </span>
            <div style={{ width: '28px', height: '1px', background: scene.accent, opacity: 0.6 }} />
        </div>
    </div>
);

const OutroScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', textAlign: 'center', padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <ParticleField accent={scene.accent} />

        {/* Starburst rays */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            {Array.from({ length: 8 }, (_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: '1.5px', height: '120px',
                    background: `linear-gradient(to top, ${scene.accent}44, transparent)`,
                    transformOrigin: 'bottom center',
                    transform: `rotate(${i * 45}deg) translateY(-60px)`,
                    opacity: enter ? 0.5 : 0,
                    transition: `opacity 0.5s ease ${0.3 + i * 0.05}s`,
                    animation: enter ? 'spinRayField 12s linear infinite' : 'none',
                }} />
            ))}
        </div>

        {/* Pulsing glow */}
        <div style={{
            position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
            background: `radial-gradient(circle, ${scene.accent}18 0%, transparent 70%)`,
            animation: enter ? 'pulse 2.5s ease-in-out infinite' : 'none',
        }} />

        <div style={{
            fontSize: '58px', position: 'relative', zIndex: 1,
            filter: `drop-shadow(0 0 25px ${scene.accent})`,
            transform: enter ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.85s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            animation: enter ? 'iconFloat 3s ease-in-out 0.9s infinite' : 'none',
        }}>{scene.icon}</div>

        <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: '900',
            fontSize: 'clamp(18px, 4vw, 32px)', color: '#fff', margin: 0,
            background: `linear-gradient(135deg, #fff 30%, ${scene.accent})`,
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: enter ? 'gradShift 3s ease infinite' : 'none',
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.28s, transform 0.6s ease 0.28s',
            position: 'relative', zIndex: 1,
        }}>{scene.headline}</h2>

        <p style={{
            fontSize: 'clamp(12px, 2.2vw, 15px)', color: 'rgba(255,255,255,0.58)',
            maxWidth: '400px', lineHeight: 1.8, margin: 0,
            opacity: enter ? 1 : 0, transform: enter ? 'none' : 'translateY(14px)',
            transition: 'opacity 0.6s ease 0.45s, transform 0.6s ease 0.45s',
            position: 'relative', zIndex: 1,
        }}>{scene.subtext}</p>
    </div>
);

const RENDERERS = {
    intro: IntroScene, context: ContextScene, timeline: TimelineScene,
    stat: StatScene, steps: StepsScene, fact: FactScene,
    example: ExampleScene, quote: QuoteScene, outro: OutroScene,
};

// ══════════════════════════════════════════════════════════════════════
// MAIN PLAYER
// ══════════════════════════════════════════════════════════════════════
const VisualizationModal = ({ data, loading, error, onClose, nodeTitle }) => {
    const [sceneIdx, setSceneIdx] = useState(0);
    const [enter, setEnter] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(null);
    const overlayRef = useRef(null);

    const scenes = data?.scenes || [];
    const scene = scenes[sceneIdx];
    const FPS = 30;

    const goToScene = useCallback((idx) => {
        setEnter(false);
        setTimeout(() => {
            setSceneIdx(idx);
            setProgress(0);
            setEnter(true);
        }, 220);
    }, []);

    useEffect(() => {
        if (!scenes.length || !playing) return;
        const dur = (scene?.duration || 5) * 1000;
        const step = 100 / (dur / (1000 / FPS));
        progressRef.current = setInterval(() => {
            setProgress(p => {
                if (p + step >= 100) {
                    clearInterval(progressRef.current);
                    if (sceneIdx < scenes.length - 1) setTimeout(() => goToScene(sceneIdx + 1), 100);
                    else setPlaying(false);
                    return 100;
                }
                return p + step;
            });
        }, 1000 / FPS);
        return () => clearInterval(progressRef.current);
    }, [sceneIdx, playing, scenes.length]);

    useEffect(() => {
        if (!scenes.length) return;
        const t = setTimeout(() => setEnter(true), 50);
        return () => clearTimeout(t);
    }, [sceneIdx, scenes.length]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === ' ') { e.preventDefault(); togglePlay(); }
            if (e.key === 'ArrowRight' && sceneIdx < scenes.length - 1) goToScene(sceneIdx + 1);
            if (e.key === 'ArrowLeft' && sceneIdx > 0) goToScene(sceneIdx - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [sceneIdx, playing, scenes.length]);

    const togglePlay = () => {
        if (!playing && progress >= 100 && sceneIdx === scenes.length - 1) {
            goToScene(0); setPlaying(true);
        } else {
            setPlaying(p => !p);
        }
    };

    const prev = () => { if (sceneIdx > 0) goToScene(sceneIdx - 1); };
    const next = () => { if (sceneIdx < scenes.length - 1) goToScene(sceneIdx + 1); };
    const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };

    const bg = scene?.accent
        ? `radial-gradient(ellipse 90% 70% at 50% 30%, ${scene.accent}12 0%, transparent 65%)`
        : 'none';

    const Renderer = scene ? (RENDERERS[scene.style] || FactScene) : null;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', animation: 'fadeBgIn 0.3s ease-out',
            }}
        >
            <div style={{
                width: '100%', maxWidth: '700px',
                background: 'linear-gradient(160deg, #0a0a14 0%, #07070e 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', overflow: 'hidden',
                boxShadow: `0 40px 120px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px ${scene?.accent || '#00d4ff'}0a`,
                animation: 'modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.8s ease',
            }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            letterSpacing: '1.5px', color: scene?.accent || 'var(--accent-cyan)',
                            background: `${scene?.accent || '#00d4ff'}18`,
                            border: `1px solid ${scene?.accent || '#00d4ff'}33`,
                            borderRadius: '6px', padding: '3px 8px', flexShrink: 0,
                            transition: 'all 0.5s ease',
                        }}>Neuro Pro</div>
                        <span style={{
                            fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)',
                            fontFamily: 'var(--font-display)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{data?.title || nodeTitle}</span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', borderRadius: '8px',
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    ><X size={14} /></button>
                </div>

                {/* ── Scene Stage ── */}
                <div style={{
                    height: '390px', position: 'relative', overflow: 'hidden', background: '#07070e',
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: bg, transition: 'background 1s ease', pointerEvents: 'none' }} />

                    {/* Subtle animated scan line across stage */}
                    {!loading && !error && Renderer && (
                        <div style={{
                            position: 'absolute', left: 0, right: 0, height: '1px',
                            background: `linear-gradient(90deg, transparent, ${scene?.accent || '#00d4ff'}18, transparent)`,
                            animation: 'stageScan 6s ease-in-out infinite',
                            pointerEvents: 'none', zIndex: 10,
                        }} />
                    )}

                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="3.5"
                                    strokeDasharray="125" strokeLinecap="round"
                                    style={{ animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                                Generating deep explainer…
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                            <div style={{ fontSize: '36px' }}>⚠️</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', maxWidth: '300px', textAlign: 'center' }}>{error}</div>
                        </div>
                    )}

                    {!loading && !error && Renderer && <Renderer scene={scene} enter={enter} />}

                    {!loading && !error && scenes.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '12px',
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            color: 'rgba(255,255,255,0.22)',
                            background: 'rgba(0,0,0,0.45)', borderRadius: '5px', padding: '2px 7px',
                        }}>{sceneIdx + 1} / {scenes.length}</div>
                    )}
                </div>

                {/* ── Controls ── */}
                {!loading && !error && scenes.length > 0 && (
                    <div style={{
                        padding: '11px 16px 13px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.015)',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                        {/* Segmented progress */}
                        <div style={{ display: 'flex', gap: '2px', cursor: 'pointer' }}
                            onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                goToScene(Math.min(Math.floor(pct * scenes.length), scenes.length - 1));
                            }}
                        >
                            {scenes.map((s, i) => (
                                <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '2px',
                                        background: s.accent || scene?.accent || '#00d4ff',
                                        boxShadow: i === sceneIdx ? `0 0 8px ${s.accent || scene?.accent || '#00d4ff'}` : 'none',
                                        width: i < sceneIdx ? '100%' : i === sceneIdx ? `${progress}%` : '0%',
                                        transition: i === sceneIdx ? 'none' : 'width 0.3s ease',
                                    }} />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Dots */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {scenes.map((s, i) => (
                                    <button key={i} onClick={() => goToScene(i)} style={{
                                        width: i === sceneIdx ? '18px' : '6px',
                                        height: '6px', borderRadius: '3px',
                                        background: i === sceneIdx ? (scene?.accent || '#00d4ff') : 'rgba(255,255,255,0.16)',
                                        border: 'none', cursor: 'pointer', padding: 0,
                                        transition: 'all 0.3s ease',
                                        boxShadow: i === sceneIdx ? `0 0 8px ${scene?.accent || '#00d4ff'}` : 'none',
                                    }} />
                                ))}
                            </div>

                            {/* Playback */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={prev} disabled={sceneIdx === 0} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                                    cursor: sceneIdx === 0 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s',
                                }}><SkipBack size={15} /></button>

                                <button onClick={togglePlay} style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: scene?.accent || '#00d4ff',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 20px ${scene?.accent || '#00d4ff'}55`,
                                    transition: 'all 0.3s ease', color: '#000',
                                }}>
                                    {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                                </button>

                                <button onClick={next} disabled={sceneIdx === scenes.length - 1} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === scenes.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                                    cursor: sceneIdx === scenes.length - 1 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s',
                                }}><SkipForward size={15} /></button>
                            </div>

                            <div style={{
                                fontSize: '10px', fontFamily: 'var(--font-mono)',
                                color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase',
                                letterSpacing: '0.5px', minWidth: '54px', textAlign: 'right',
                            }}>{scene?.style}</div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeBgIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes modalIn { from { transform: translateY(24px) scale(0.95); opacity: 0 } to { transform: none; opacity: 1 } }
                @keyframes spinDash {
                    0%   { stroke-dashoffset: 125; stroke-dasharray: 1 124; }
                    50%  { stroke-dashoffset: 0;   stroke-dasharray: 100 25; }
                    100% { stroke-dashoffset: -125; stroke-dasharray: 1 124; }
                }
                @keyframes pulse { 0%,100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.65; transform: scale(1.2); } }
                @keyframes ringPulse { 0%,100% { opacity: 0.12; transform: scale(1); } 50% { opacity: 0.22; transform: scale(1.06); } }
                @keyframes iconFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
                @keyframes gradShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
                @keyframes spinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spinRayField { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes dotGlow { 0%,100% { box-shadow: 0 0 6px currentColor; } 50% { box-shadow: 0 0 16px currentColor; } }
                @keyframes stageScan {
                    0%   { top: -1px; opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes particle0 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(14px,-18px) scale(1.15); } }
                @keyframes particle1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-16px,12px) scale(0.85); } }
                @keyframes particle2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10px,16px) scale(1.1); } }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
