import React, { useState, useEffect } from 'react';
import { ArrowRight, Sun, Moon, Download } from 'lucide-react';
import AuthModal from './AuthModal';
import NeuroAvatar from '../UI/NeuroAvatar';

const FEATURES = [
    { icon: '🔬', title: 'Research Mode', desc: 'Explore topics from every angle' },
    { icon: '📚', title: 'Learning Path', desc: 'Beginner-to-expert journeys' },
    { icon: '💡', title: 'Brainstorm', desc: 'Creative ideation framework' },
    { icon: '🗺️', title: 'Study Guide', desc: 'Exam-ready study material' },
    { icon: '🔗', title: 'Connect', desc: 'Discover hidden connections' },
];

const isIOS = () => {
    return (
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
};

const LandingPage = ({ onAuth, theme, toggleTheme }) => {
    const [authMode, setAuthMode] = useState(null);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);
    const isDark = theme === 'dark';

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        if (isIOS()) {
            setShowInstall(true);
            return;
        }

        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = () => {
        if (isIOS()) {
            alert("Error, please try again.");
            return;
        }
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setShowInstall(false);
            }
        });
    };

    return (
        <div style={{
            width: '100vw',
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
            overflow: 'auto',
            position: 'relative',
            transition: 'background 0.3s, color 0.3s'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: `
                    radial-gradient(ellipse 800px 600px at 30% 20%, rgba(0,212,255,0.06) 0%, transparent 70%),
                    radial-gradient(ellipse 600px 500px at 70% 60%, rgba(124,58,237,0.05) 0%, transparent 70%),
                    radial-gradient(ellipse 400px 300px at 50% 80%, rgba(249,115,22,0.03) 0%, transparent 70%)
                `
            }} />

            {/* Grid Overlay */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.4,
                backgroundImage: `
                    linear-gradient(var(--glass-border) 1px, transparent 1px),
                    linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
            }} />

            {/* NAV BAR */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                padding: '14px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--glass)',
                backdropFilter: 'blur(var(--glass-blur))',
                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <NeuroAvatar state="idle" size={30} />
                    <span style={{
                        fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800',
                        background: 'linear-gradient(135deg, var(--text), var(--accent-cyan))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Neuro</span>
                </div>

                {/* Nav actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            width: '36px', height: '36px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    <button
                        onClick={() => setAuthMode('login')}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >Log In</button>
                    <button
                        onClick={() => setAuthMode('signup')}
                        style={{
                            background: 'var(--gradient-cyan)', border: 'none',
                            color: isDark ? '#050709' : '#fff',
                            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '600',
                            transition: 'all 0.2s', boxShadow: 'var(--shadow-glow-cyan)'
                        }}
                    >Get Started</button>
                </div>

                {showInstall && (
                    <div style={{ marginTop: '24px', animation: 'fadeInUp 0.8s ease-out 0.45s backwards' }}>
                        <button
                            onClick={handleInstall}
                            style={{
                                background: 'var(--glass)',
                                backdropFilter: 'blur(var(--glass-blur))',
                                border: '1px solid var(--accent-purple)',
                                color: 'var(--accent-purple)',
                                padding: '12px 28px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-display)',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow-purple)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <Download size={15} />
                            Install Neuro
                        </button>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section style={{
                position: 'relative', zIndex: 1, minHeight: '100vh',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                alignItems: 'center', textAlign: 'center',
                padding: '120px 24px 60px', gap: '24px'
            }}>
                <div style={{ marginBottom: '16px', animation: 'float 6s ease-in-out infinite' }}>
                    <NeuroAvatar state="idle" size={80} />
                </div>

                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(34px, 6vw, 64px)',
                    fontWeight: '800', lineHeight: 1.1, maxWidth: '700px',
                    background: 'linear-gradient(135deg, var(--text) 30%, var(--accent-cyan) 60%, var(--accent-purple) 90%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 6s ease infinite, fadeInUp 0.8s ease-out',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Map Any Idea Into Visual Knowledge
                </h1>

                <p style={{
                    fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '500px',
                    lineHeight: 1.6, animation: 'fadeInUp 0.8s ease-out 0.15s backwards'
                }}>
                    AI-powered mind maps that help you research, learn, brainstorm, and connect ideas — beautifully.
                </p>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeInUp 0.8s ease-out 0.3s backwards' }}>
                    <button
                        onClick={() => setAuthMode('signup')}
                        style={{
                            background: 'var(--gradient-cyan)', border: 'none',
                            color: isDark ? '#050709' : '#fff',
                            padding: '14px 32px', borderRadius: '12px', cursor: 'pointer',
                            fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.3s', boxShadow: 'var(--shadow-glow-cyan)'
                        }}
                    >
                        Start Mapping Free <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => setAuthMode('login')}
                        style={{
                            background: 'var(--glass)', backdropFilter: 'blur(var(--glass-blur))',
                            border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                            padding: '14px 32px', borderRadius: '12px', cursor: 'pointer',
                            fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600',
                            transition: 'all 0.3s'
                        }}
                    >Log In</button>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section style={{
                position: 'relative', zIndex: 1,
                padding: '40px 24px 100px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700',
                    color: 'var(--text)', textAlign: 'center'
                }}>Five Ways to Think</h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', maxWidth: '800px' }}>
                    {FEATURES.map((f, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--glass)', backdropFilter: 'blur(var(--glass-blur))',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '14px', padding: '20px', width: '145px',
                                textAlign: 'center', transition: 'all 0.3s',
                                animation: `fadeInUp 0.6s ease-out ${i * 0.1}s backwards`
                            }}
                        >
                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{f.icon}</div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>{f.title}</h3>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {authMode && (
                <AuthModal
                    mode={authMode}
                    onSwitchMode={setAuthMode}
                    onClose={() => setAuthMode(null)}
                    onSuccess={onAuth}
                />
            )}
        </div>
    );
};

export default LandingPage;
