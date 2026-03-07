import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

// ── Animated counter ────────────────────────────────────────────────────
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

// ── Format a stat value ─────────────────────────────────────────────────
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

// ── Shared styles ───────────────────────────────────────────────────────
const CENTER = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '28px 36px' };
const fade = (enter, delay = 0, axis = 'Y', dist = 20) => ({
    transform: enter ? 'none' : `translate${axis}(${dist}px)`,
    opacity: enter ? 1 : 0,
    transition: `transform 0.55s ease ${delay}s, opacity 0.55s ease ${delay}s`,
});
const pop = (enter, delay = 0) => ({
    transform: enter ? 'scale(1)' : 'scale(0.3)',
    opacity: enter ? 1 : 0,
    transition: `transform 0.65s cubic-bezier(0.34,1.56,0.64,1) ${delay}s, opacity 0.45s ease ${delay}s`,
});

// ══════════════════════════════════════════════════════════════════════
// SCENE RENDERERS
// ══════════════════════════════════════════════════════════════════════

const IntroScene = ({ scene, enter }) => (
    <div style={{ ...CENTER, gap: '18px' }}>
        <div style={{ fontSize: '68px', lineHeight: 1, filter: `drop-shadow(0 0 30px ${scene.accent})`, ...pop(enter) }}>
            {scene.icon}
        </div>
        <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: '900',
            fontSize: 'clamp(22px, 5vw, 40px)', lineHeight: 1.1, color: '#fff', margin: 0,
            background: `linear-gradient(135deg, #fff 40%, ${scene.accent})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            ...fade(enter, 0.2),
        }}>{scene.headline}</h1>
        <p style={{ fontSize: 'clamp(13px, 2.5vw, 16px)', color: 'rgba(255,255,255,0.6)', maxWidth: '420px', lineHeight: 1.7, margin: 0, ...fade(enter, 0.4) }}>
            {scene.subtext}
        </p>
    </div>
);

const ContextScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...fade(enter, 0, 'X', -20) }}>
            <span style={{ fontSize: '30px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(16px, 3.5vw, 24px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>
        {scene.body && (
            <p style={{ fontSize: 'clamp(12px, 2vw, 14px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0, ...fade(enter, 0.15) }}>
                {scene.body}
            </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {(scene.bullets || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', ...fade(enter, 0.25 + i * 0.15, 'X', -24) }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: scene.accent, flexShrink: 0, marginTop: '7px', boxShadow: `0 0 8px ${scene.accent}` }} />
                    <span style={{ fontSize: 'clamp(12px, 2.2vw, 14px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{b}</span>
                </div>
            ))}
        </div>
    </div>
);

const TimelineScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '22px 36px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', ...fade(enter, 0) }}>
            <span style={{ fontSize: '26px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(15px, 3vw, 22px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', paddingLeft: '20px' }}>
            {/* vertical line */}
            <div style={{
                position: 'absolute', left: '6px', top: '8px', bottom: '8px', width: '2px',
                background: `linear-gradient(to bottom, ${scene.accent}, transparent)`,
                ...fade(enter, 0.1),
            }} />
            {(scene.events || []).map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', ...fade(enter, 0.15 + i * 0.18) }}>
                    <div style={{
                        position: 'relative', flexShrink: 0, marginTop: '4px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: scene.accent, boxShadow: `0 0 10px ${scene.accent}`,
                        marginLeft: '-25px',
                    }} />
                    <div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: scene.accent, letterSpacing: '0.5px', display: 'block', marginBottom: '2px' }}>
                            {ev.year}
                        </span>
                        <span style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{ev.event}</span>
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
    return (
        <div style={{ ...CENTER, gap: '14px' }}>
            <div style={{ fontSize: '38px', ...pop(enter) }}>{scene.icon}</div>
            <div style={{
                fontFamily: 'var(--font-display)', fontWeight: '900',
                fontSize: 'clamp(52px, 11vw, 88px)', lineHeight: 1,
                color: scene.accent, letterSpacing: '-2px',
                textShadow: `0 0 60px ${scene.accent}88`,
                ...pop(enter, 0.1),
            }}>
                {displayed}
                {displayedUnit && <span style={{ fontSize: '0.4em', opacity: 0.8, letterSpacing: 0 }}>{displayedUnit}</span>}
            </div>
            <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-display)', ...fade(enter, 0.3) }}>
                {scene.headline}
            </div>
            <p style={{ fontSize: 'clamp(11px, 2vw, 14px)', color: 'rgba(255,255,255,0.55)', maxWidth: '360px', lineHeight: 1.7, margin: 0, ...fade(enter, 0.5) }}>
                {scene.subtext}
            </p>
        </div>
    );
};

const StepsScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '22px 36px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', ...fade(enter, 0) }}>
            <span style={{ fontSize: '26px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(15px, 3vw, 22px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(scene.steps || []).map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', ...fade(enter, 0.15 + i * 0.18) }}>
                    <div style={{
                        flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
                        background: scene.accent, color: '#000', fontWeight: '900',
                        fontSize: '12px', fontFamily: 'var(--font-display)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 12px ${scene.accent}88`, marginTop: '1px',
                    }}>{i + 1}</div>
                    <span style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{step}</span>
                </div>
            ))}
        </div>
    </div>
);

const FactScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ...fade(enter, 0, 'X', -20) }}>
            <span style={{ fontSize: '30px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(16px, 3.5vw, 24px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(scene.bullets || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', ...fade(enter, 0.2 + i * 0.15, 'X', -28) }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: scene.accent, flexShrink: 0, marginTop: '6px', boxShadow: `0 0 10px ${scene.accent}` }} />
                    <span style={{ fontSize: 'clamp(12px, 2.2vw, 14px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{b}</span>
                </div>
            ))}
        </div>
    </div>
);

const ExampleScene = ({ scene, enter }) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '24px 36px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...fade(enter, 0) }}>
            <span style={{ fontSize: '28px' }}>{scene.icon}</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: 'clamp(14px, 3vw, 20px)', color: '#fff', margin: 0 }}>
                {scene.headline}
            </h2>
        </div>
        <div style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${scene.accent}33`,
            borderLeft: `3px solid ${scene.accent}`, borderRadius: '10px',
            padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px',
            ...fade(enter, 0.2),
        }}>
            <div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: scene.accent, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    What Happened
                </div>
                <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: 0 }}>
                    {scene.case}
                </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: scene.accent, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    The Result
                </div>
                <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0, fontWeight: '500' }}>
                    {scene.result}
                </p>
            </div>
        </div>
    </div>
);

const QuoteScene = ({ scene, enter }) => (
    <div style={{ ...CENTER, gap: '16px', padding: '36px 40px' }}>
        <div style={{ fontSize: '56px', lineHeight: 1, color: scene.accent, fontFamily: 'Georgia, serif', marginBottom: '-6px', ...fade(enter, 0, 'Y', -16) }}>
            "
        </div>
        <blockquote style={{
            fontFamily: 'var(--font-display)', fontWeight: '600',
            fontSize: 'clamp(14px, 3vw, 22px)', color: '#fff',
            lineHeight: 1.6, margin: 0, fontStyle: 'italic',
            textShadow: `0 0 40px ${scene.accent}44`,
            ...fade(enter, 0.15),
        }}>{scene.quote}</blockquote>
        <div style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: scene.accent, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', ...fade(enter, 0.4) }}>
            — {scene.attribution}
        </div>
    </div>
);

const OutroScene = ({ scene, enter }) => (
    <div style={{ ...CENTER, gap: '16px' }}>
        <div style={{
            fontSize: '58px',
            transform: enter ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)',
            opacity: enter ? 1 : 0,
            transition: 'transform 0.8s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            filter: `drop-shadow(0 0 25px ${scene.accent})`,
        }}>{scene.icon}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: 'clamp(18px, 4vw, 32px)', color: '#fff', margin: 0, ...fade(enter, 0.25) }}>
            {scene.headline}
        </h2>
        <p style={{ fontSize: 'clamp(12px, 2.2vw, 15px)', color: 'rgba(255,255,255,0.6)', maxWidth: '400px', lineHeight: 1.75, margin: 0, ...fade(enter, 0.45) }}>
            {scene.subtext}
        </p>
        <div style={{
            position: 'absolute', width: '220px', height: '220px', borderRadius: '50%',
            background: `radial-gradient(circle, ${scene.accent}1a 0%, transparent 70%)`,
            animation: enter ? 'pulse 2.5s ease-in-out infinite' : 'none',
            pointerEvents: 'none',
        }} />
    </div>
);

const RENDERERS = {
    intro: IntroScene,
    context: ContextScene,
    timeline: TimelineScene,
    stat: StatScene,
    steps: StepsScene,
    fact: FactScene,
    example: ExampleScene,
    quote: QuoteScene,
    outro: OutroScene,
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

    // Trigger enter animation on scene mount
    useEffect(() => {
        if (!scenes.length) return;
        const t = setTimeout(() => setEnter(true), 50);
        return () => clearTimeout(t);
    }, [sceneIdx, scenes.length]);

    // Keyboard shortcuts
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
            goToScene(0);
            setPlaying(true);
        } else {
            setPlaying(p => !p);
        }
    };

    const prev = () => { if (sceneIdx > 0) goToScene(sceneIdx - 1); };
    const next = () => { if (sceneIdx < scenes.length - 1) goToScene(sceneIdx + 1); };
    const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };

    const bg = scene?.accent
        ? `radial-gradient(ellipse 80% 60% at 50% 40%, ${scene.accent}15 0%, transparent 70%)`
        : 'none';

    const Renderer = scene ? (RENDERERS[scene.style] || FactScene) : null;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                animation: 'fadeBgIn 0.3s ease-out',
            }}
        >
            <div style={{
                width: '100%', maxWidth: '700px',
                background: '#07070e',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: `0 40px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)`,
                animation: 'modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'flex', flexDirection: 'column',
            }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px',
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
                        }}>Neuro Pro · Explainer</div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-display)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {data?.title || nodeTitle}
                        </span>
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
                    height: '380px', position: 'relative', overflow: 'hidden',
                    background: '#07070e', transition: 'background 0.8s ease',
                }}>
                    <div style={{ position: 'absolute', inset: 0, background: bg, transition: 'background 0.8s ease', pointerEvents: 'none' }} />

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px' }}>
                            <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="3.5"
                                    strokeDasharray="125" strokeLinecap="round"
                                    style={{ animation: 'spinDash 1.4s ease-in-out infinite' }} />
                            </svg>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                                Generating deep explainer…
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                            <div style={{ fontSize: '38px' }}>⚠️</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', maxWidth: '300px', textAlign: 'center' }}>{error}</div>
                        </div>
                    )}

                    {/* Scene */}
                    {!loading && !error && Renderer && <Renderer scene={scene} enter={enter} />}

                    {/* Scene counter */}
                    {!loading && !error && scenes.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '12px',
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            color: 'rgba(255,255,255,0.25)',
                            background: 'rgba(0,0,0,0.4)', borderRadius: '5px', padding: '2px 7px',
                        }}>
                            {sceneIdx + 1} / {scenes.length}
                        </div>
                    )}
                </div>

                {/* ── Controls ── */}
                {!loading && !error && scenes.length > 0 && (
                    <div style={{
                        padding: '12px 16px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                        {/* Segmented progress bar */}
                        <div style={{ position: 'relative', height: '3px', borderRadius: '2px', cursor: 'pointer', display: 'flex', gap: '2px' }}
                            onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = (e.clientX - rect.left) / rect.width;
                                goToScene(Math.min(Math.floor(pct * scenes.length), scenes.length - 1));
                            }}
                        >
                            {scenes.map((s, i) => (
                                <div key={i} style={{
                                    flex: 1, height: '3px', borderRadius: '2px', overflow: 'hidden',
                                    background: 'rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: '2px',
                                        background: s.accent || scene?.accent || '#00d4ff',
                                        width: i < sceneIdx ? '100%' : i === sceneIdx ? `${progress}%` : '0%',
                                        transition: i === sceneIdx ? 'none' : 'width 0.3s ease',
                                    }} />
                                </div>
                            ))}
                        </div>

                        {/* Buttons row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Scene dots */}
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {scenes.map((s, i) => (
                                    <button key={i} onClick={() => goToScene(i)} style={{
                                        width: i === sceneIdx ? '18px' : '6px',
                                        height: '6px', borderRadius: '3px',
                                        background: i === sceneIdx ? (scene?.accent || '#00d4ff') : 'rgba(255,255,255,0.18)',
                                        border: 'none', cursor: 'pointer', padding: 0,
                                        transition: 'all 0.3s ease',
                                        boxShadow: i === sceneIdx ? `0 0 7px ${scene?.accent || '#00d4ff'}` : 'none',
                                    }} />
                                ))}
                            </div>

                            {/* Playback controls */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button onClick={prev} disabled={sceneIdx === 0} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)',
                                    cursor: sceneIdx === 0 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s',
                                }}><SkipBack size={15} /></button>

                                <button onClick={togglePlay} style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: scene?.accent || '#00d4ff',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 18px ${scene?.accent || '#00d4ff'}55`,
                                    transition: 'all 0.3s ease', color: '#000',
                                }}>
                                    {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                                </button>

                                <button onClick={next} disabled={sceneIdx === scenes.length - 1} style={{
                                    background: 'transparent', border: 'none',
                                    color: sceneIdx === scenes.length - 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)',
                                    cursor: sceneIdx === scenes.length - 1 ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', padding: '4px', transition: 'color 0.2s',
                                }}><SkipForward size={15} /></button>
                            </div>

                            {/* Scene type label */}
                            <div style={{
                                fontSize: '10px', fontFamily: 'var(--font-mono)',
                                color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
                                letterSpacing: '0.5px', minWidth: '54px', textAlign: 'right',
                            }}>
                                {scene?.style}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeBgIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes modalIn { from { transform: translateY(22px) scale(0.96); opacity: 0 } to { transform: none; opacity: 1 } }
                @keyframes spinDash {
                    0%   { stroke-dashoffset: 125; stroke-dasharray: 1 124; }
                    50%  { stroke-dashoffset: 0;   stroke-dasharray: 100 25; }
                    100% { stroke-dashoffset: -125; stroke-dasharray: 1 124; }
                }
                @keyframes pulse { 0%,100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.18); } }
            `}</style>
        </div>
    );
};

export default VisualizationModal;
