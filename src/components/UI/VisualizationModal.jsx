import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

// ── Animated counter ───────────────────────────────────────────────────
const useCountUp = (target, active, duration = 1800) => {
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

// ── Format a stat value ────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════
// SCENE RENDERERS
// ══════════════════════════════════════════════════════════════════════

const IntroScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', textAlign: 'center', padding: '32px' }}>
        <div style={{
            fontSize: '72px', lineHeight: 1,
            transform: enter ? 'scale(1)' : 'scale(0.3)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            filter: `drop-shadow(0 0 30px ${scene.accent})`,
        }}>{scene.icon}</div>
        <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: '900',
            fontSize: 'clamp(24px, 5vw, 42px)', lineHeight: 1.1,
            color: '#fff', margin: 0,
            transform: enter ? 'translateY(0)' : 'translateY(30px)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.6s ease 0.2s, opacity 0.6s ease 0.2s',
            background: `linear-gradient(135deg, #fff 40%, ${scene.accent})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{scene.headline}</h1>
        <p style={{
            fontSize: 'clamp(13px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.65)',
            maxWidth: '400px', lineHeight: 1.6, margin: 0,
            transform: enter ? 'translateY(0)' : 'translateY(20px)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.6s ease 0.45s, opacity 0.6s ease 0.45s',
        }}>{scene.subtext}</p>
    </div>
);

const StatScene = ({ scene, enter }) => {
    const raw = scene.stat?.value || 0;
    const unit = scene.stat?.unit || '';
    const val = useCountUp(raw, enter);
    const displayed = fmtStat(val, unit);
    const displayedUnit = unit.replace(/billion|million|trillion/gi, '').trim();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', textAlign: 'center', padding: '32px' }}>
            <div style={{
                fontSize: '40px',
                transform: enter ? 'scale(1)' : 'scale(0)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
            }}>{scene.icon}</div>
            <div style={{
                fontFamily: 'var(--font-display)', fontWeight: '900',
                fontSize: 'clamp(56px, 12vw, 96px)', lineHeight: 1,
                color: scene.accent,
                textShadow: `0 0 60px ${scene.accent}88`,
                transform: enter ? 'scale(1)' : 'scale(0.5)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s, opacity 0.5s ease 0.1s',
                letterSpacing: '-2px',
            }}>
                {displayed}
                {displayedUnit && <span style={{ fontSize: '0.4em', opacity: 0.8, letterSpacing: 0 }}>{displayedUnit}</span>}
            </div>
            <div style={{
                fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: '700',
                color: '#fff', fontFamily: 'var(--font-display)',
                transform: enter ? 'translateY(0)' : 'translateY(20px)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.5s ease 0.3s, opacity 0.5s ease 0.3s',
            }}>{scene.headline}</div>
            <p style={{
                fontSize: 'clamp(12px, 2vw, 15px)', color: 'rgba(255,255,255,0.55)',
                maxWidth: '340px', lineHeight: 1.6, margin: 0,
                transform: enter ? 'translateY(0)' : 'translateY(15px)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.5s ease 0.5s, opacity 0.5s ease 0.5s',
            }}>{scene.subtext}</p>
        </div>
    );
};

const FactScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '32px 40px', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{
                fontSize: '36px',
                transform: enter ? 'scale(1)' : 'scale(0)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
            }}>{scene.icon}</span>
            <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: '800',
                fontSize: 'clamp(18px, 4vw, 28px)', color: '#fff', margin: 0,
                transform: enter ? 'translateX(0)' : 'translateX(-20px)',
                opacity: enter ? 1 : 0,
                transition: 'transform 0.5s ease 0.15s, opacity 0.5s ease 0.15s',
            }}>{scene.headline}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(scene.bullets || []).map((b, i) => (
                <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                    transform: enter ? 'translateX(0)' : 'translateX(-30px)',
                    opacity: enter ? 1 : 0,
                    transition: `transform 0.5s ease ${0.3 + i * 0.18}s, opacity 0.5s ease ${0.3 + i * 0.18}s`,
                }}>
                    <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: scene.accent, flexShrink: 0, marginTop: '7px',
                        boxShadow: `0 0 10px ${scene.accent}`,
                    }} />
                    <span style={{ fontSize: 'clamp(13px, 2.5vw, 17px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{b}</span>
                </div>
            ))}
        </div>
    </div>
);

const QuoteScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', gap: '20px', textAlign: 'center' }}>
        <div style={{
            fontSize: '64px', lineHeight: 1, color: scene.accent, opacity: 0.4,
            fontFamily: 'Georgia, serif', marginBottom: '-10px',
            transform: enter ? 'translateY(0)' : 'translateY(-20px)',
            opacity: enter ? 0.4 : 0,
            transition: 'transform 0.5s ease, opacity 0.5s ease',
        }}>"</div>
        <blockquote style={{
            fontFamily: 'var(--font-display)', fontWeight: '700',
            fontSize: 'clamp(16px, 3.5vw, 26px)', color: '#fff',
            lineHeight: 1.5, margin: 0, fontStyle: 'italic',
            transform: enter ? 'scale(1)' : 'scale(0.95)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.7s ease 0.15s, opacity 0.7s ease 0.15s',
            textShadow: `0 0 40px ${scene.accent}44`,
        }}>{scene.quote}</blockquote>
        <div style={{
            fontSize: 'clamp(11px, 2vw, 14px)', color: scene.accent,
            fontFamily: 'var(--font-mono)', letterSpacing: '1px',
            transform: enter ? 'translateY(0)' : 'translateY(15px)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.5s ease 0.5s, opacity 0.5s ease 0.5s',
        }}>— {scene.attribution}</div>
    </div>
);

const OutroScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '18px', textAlign: 'center', padding: '32px' }}>
        <div style={{
            fontSize: '60px',
            transform: enter ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            filter: `drop-shadow(0 0 25px ${scene.accent})`,
        }}>{scene.icon}</div>
        <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: '900',
            fontSize: 'clamp(20px, 4.5vw, 36px)', color: '#fff', margin: 0,
            transform: enter ? 'translateY(0)' : 'translateY(25px)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.6s ease 0.25s, opacity 0.6s ease 0.25s',
        }}>{scene.headline}</h2>
        <p style={{
            fontSize: 'clamp(13px, 2.5vw, 16px)', color: 'rgba(255,255,255,0.6)',
            maxWidth: '380px', lineHeight: 1.7, margin: 0,
            transform: enter ? 'translateY(0)' : 'translateY(15px)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.6s ease 0.45s, opacity 0.6s ease 0.45s',
        }}>{scene.subtext}</p>
        {/* Glow pulse */}
        <div style={{
            position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
            background: `radial-gradient(circle, ${scene.accent}22 0%, transparent 70%)`,
            animation: enter ? 'pulse 2s ease-in-out infinite' : 'none',
            pointerEvents: 'none',
        }} />
    </div>
);

const RENDERERS = { intro: IntroScene, stat: StatScene, fact: FactScene, quote: QuoteScene, outro: OutroScene };

// ══════════════════════════════════════════════════════════════════════
// MAIN PLAYER
// ══════════════════════════════════════════════════════════════════════
const VisualizationModal = ({ data, loading, error, onClose, nodeTitle }) => {
    const [sceneIdx, setSceneIdx] = useState(0);
    const [enter, setEnter] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
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
        }, 250);
    }, []);

    // Auto-advance
    useEffect(() => {
        if (!scenes.length || !playing) return;
        const dur = (scene?.duration || 5) * 1000;
        const step = 100 / (dur / (1000 / FPS));

        progressRef.current = setInterval(() => {
            setProgress(p => {
                if (p + step >= 100) {
                    clearInterval(progressRef.current);
                    if (sceneIdx < scenes.length - 1) {
                        setTimeout(() => goToScene(sceneIdx + 1), 100);
                    } else {
                        setPlaying(false);
                    }
                    return 100;
                }
                return p + step;
            });
        }, 1000 / FPS);

        return () => clearInterval(progressRef.current);
    }, [sceneIdx, playing, scenes.length]);

    // Trigger enter animation when scene changes
    useEffect(() => {
        if (!scenes.length) return;
        const t = setTimeout(() => setEnter(true), 50);
        return () => clearTimeout(t);
    }, [sceneIdx, scenes.length]);

    const togglePlay = () => {
        if (!playing && progress >= 100 && sceneIdx === scenes.length - 1) {
            goToScene(0);
            setPlaying(true);
        } else {
            setPlaying(p => !p);
        }
    };

    const prev = () => { if (sceneIdx > 0) goToScene(sceneIdx - 1); };
    const next = () => { if (sceneIdx < scenes.length - 1) goToScene(sceneIdx + 1); };

    const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };

    // ── Background: per-scene gradient ──
    const bg = scene?.accent
        ? `radial-gradient(ellipse 80% 60% at 50% 40%, ${scene.accent}18 0%, transparent 70%)`
        : 'none';

    const Renderer = scene ? (RENDERERS[scene.style] || IntroScene) : null;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                animation: 'fadeBgIn 0.3s ease-out',
            }}
        >
            <div style={{
                width: '100%', maxWidth: '680px',
                background: '#08080f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)`,
                animation: 'modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                            letterSpacing: '1.5px', color: scene?.accent || 'var(--accent-cyan)',
                            background: `${scene?.accent || '#00d4ff'}18`,
                            border: `1px solid ${scene?.accent || '#00d4ff'}33`,
                            borderRadius: '6px', padding: '3px 8px',
                            transition: 'all 0.5s ease',
                        }}>✦ Pro · Explainer</div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-display)' }}>
                            {data?.title || nodeTitle}
                        </span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.5)', borderRadius: '8px',
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    ><X size={14} /></button>
                </div>

                {/* ── Scene Stage ── */}
                <div style={{
                    height: '340px', position: 'relative', overflow: 'hidden',
                    background: `#08080f`,
                    transition: 'background 0.8s ease',
                }}>
                    {/* Dynamic glow background */}
                    <div style={{
                        position: 'absolute', inset: 0, background: bg,
                        transition: 'background 0.8s ease',
                        pointerEvents: 'none',
                    }} />

                    {/* Loading state */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--accent-cyan)" strokeWidth="4"
                                    strokeDasharray="138" strokeLinecap="round"
                                    style={{ animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                                Generating your explainer…
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                            <div style={{ fontSize: '40px' }}>⚠️</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{error}</div>
                        </div>
                    )}

                    {/* Scene content */}
                    {!loading && !error && Renderer && (
                        <Renderer scene={scene} enter={enter} />
                    )}

                    {/* Scene counter (top-right) */}
                    {!loading && !error && scenes.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '12px', right: '14px',
                            fontSize: '11px', fontFamily: 'var(--font-mono)',
                            color: 'rgba(255,255,255,0.3)',
                            background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '3px 8px',
                        }}>
                            {sceneIdx + 1} / {scenes.length}
                        </div>
                    )}
                </div>

                {/* ── Controls ── */}
                {!loading && !error && scenes.length > 0 && (
                    <div style={{
                        padding: '14px 18px 16px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                    }}>
                        {/* Progress bar */}
                        <div style={{ position: 'relative', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', cursor: 'pointer' }}
                            onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                const totalScenes = scenes.length;
                                const sceneForPct = Math.floor(pct * totalScenes);
                                goToScene(Math.min(sceneForPct, totalScenes - 1));
                            }}
                        >
                            {/* Segments */}
                            {scenes.map((_, i) => (
                                <div key={i} style={{
                                    position: 'absolute', top: 0, bottom: 0,
                                    left: `${(i / scenes.length) * 100}%`,
                                    width: `${(1 / scenes.length) * 100 - 0.3}%`,
                                    borderRadius: '2px',
                                    background: i < sceneIdx
                                        ? (scenes[i]?.accent || '#00d4ff')
                                        : i === sceneIdx
                                            ? `linear-gradient(90deg, ${scene?.accent || '#00d4ff'} ${progress}%, rgba(255,255,255,0.15) ${progress}%)`
                                            : 'rgba(255,255,255,0.08)',
                                    transition: i < sceneIdx ? 'background 0.3s ease' : 'none',
                                }} />
                            ))}
                        </div>

                        {/* Buttons row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Left: scene dots */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {scenes.map((s, i) => (
                                    <button key={i} onClick={() => goToScene(i)} style={{
                                        width: i === sceneIdx ? '20px' : '7px',
                                        height: '7px', borderRadius: '4px',
                                        background: i === sceneIdx ? (scene?.accent || '#00d4ff') : 'rgba(255,255,255,0.2)',
                                        border: 'none', cursor: 'pointer', padding: 0,
                                        transition: 'all 0.3s ease',
                                        boxShadow: i === sceneIdx ? `0 0 8px ${scene?.accent || '#00d4ff'}` : 'none',
                                    }} />
                                ))}
                            </div>

                            {/* Center: playback controls */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={prev} disabled={sceneIdx === 0} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                                    cursor: sceneIdx === 0 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px',
                                    transition: 'color 0.2s',
                                }}><SkipBack size={16} /></button>

                                <button onClick={togglePlay} style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: scene?.accent || '#00d4ff',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 20px ${scene?.accent || '#00d4ff'}66`,
                                    transition: 'all 0.3s ease',
                                    color: '#000',
                                }}>
                                    {playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                                </button>

                                <button onClick={next} disabled={sceneIdx === scenes.length - 1} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === scenes.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                                    cursor: sceneIdx === scenes.length - 1 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px',
                                    transition: 'color 0.2s',
                                }}><SkipForward size={16} /></button>
                            </div>

                            {/* Right: scene label */}
                            <div style={{
                                fontSize: '11px', fontFamily: 'var(--font-mono)',
                                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                                letterSpacing: '0.5px', minWidth: '60px', textAlign: 'right',
                            }}>
                                {scene?.style}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeBgIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes modalIn { from { transform: translateY(24px) scale(0.96); opacity: 0 } to { transform: none; opacity: 1 } }
                @keyframes spinDash {
                    0%   { stroke-dashoffset: 138; stroke-dasharray: 1 137; }
                    50%  { stroke-dashoffset: 0;   stroke-dasharray: 110 28; }
                    100% { stroke-dashoffset: -138; stroke-dasharray: 1 137; }
                }
                @keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.15); } }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
