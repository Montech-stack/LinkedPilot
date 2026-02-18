import React, { useState } from 'react';
import { Network, ArrowRight, Sparkles, BookOpen, Lightbulb, Link2 } from 'lucide-react';
import AuthModal from './AuthModal';

const FEATURES = [
    { icon: '🔬', title: 'Research Mode', desc: 'Explore topics from every angle' },
    { icon: '📚', title: 'Learning Path', desc: 'Beginner-to-expert journeys' },
    { icon: '💡', title: 'Brainstorm', desc: 'Creative ideation framework' },
    { icon: '🗺️', title: 'Study Guide', desc: 'Exam-ready study material' },
    { icon: '🔗', title: 'Connect', desc: 'Discover hidden connections' },
];

const LandingPage = ({ onAuth }) => {
    const [authMode, setAuthMode] = useState(null); // null | 'login' | 'signup'

    return (
        <div style={{
            width: '100vw',
            minHeight: '100vh',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
            overflow: 'auto',
            position: 'relative'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                background: `
                    radial-gradient(ellipse 800px 600px at 30% 20%, rgba(0, 212, 255, 0.06) 0%, transparent 70%),
                    radial-gradient(ellipse 600px 500px at 70% 60%, rgba(124, 58, 237, 0.05) 0%, transparent 70%),
                    radial-gradient(ellipse 400px 300px at 50% 80%, rgba(249, 115, 22, 0.03) 0%, transparent 70%)
                `,
                zIndex: 0
            }} />

            {/* Grid Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
                zIndex: 0,
                opacity: 0.5
            }} />

            {/* NAV BAR */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--glass)',
                backdropFilter: 'blur(var(--glass-blur))',
                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'var(--gradient-cyan)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow-cyan)'
                    }}>
                        <Network size={18} color="#050709" strokeWidth={2.5} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, var(--text), var(--accent-cyan))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>NeuroMap</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setAuthMode('login')}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >Log In</button>
                    <button
                        onClick={() => setAuthMode('signup')}
                        style={{
                            background: 'var(--gradient-cyan)',
                            border: 'none',
                            color: '#050709',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-glow-cyan)'
                        }}
                    >Get Started</button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section style={{
                position: 'relative',
                zIndex: 1,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '120px 24px 60px',
                gap: '24px'
            }}>


                {/* Main Headline */}
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(36px, 6vw, 64px)',
                    fontWeight: '800',
                    lineHeight: 1.1,
                    maxWidth: '700px',
                    background: 'linear-gradient(135deg, var(--text) 30%, var(--accent-cyan) 60%, var(--accent-purple) 90%)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 6s ease infinite, fadeInUp 0.8s ease-out',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Map Any Idea Into Visual Knowledge
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: '17px',
                    color: 'var(--text-secondary)',
                    maxWidth: '500px',
                    lineHeight: 1.6,
                    animation: 'fadeInUp 0.8s ease-out 0.15s backwards'
                }}>
                    AI-powered mind maps that help you research, learn, brainstorm, and connect ideas — beautifully.
                </p>

                {/* CTA Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                    animation: 'fadeInUp 0.8s ease-out 0.3s backwards'
                }}>
                    <button
                        onClick={() => setAuthMode('signup')}
                        style={{
                            background: 'var(--gradient-cyan)',
                            border: 'none',
                            color: '#050709',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                            fontSize: '15px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s',
                            boxShadow: 'var(--shadow-glow-cyan)'
                        }}
                    >
                        Start Mapping Free
                        <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => setAuthMode('login')}
                        style={{
                            background: 'var(--glass)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            padding: '14px 32px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                            fontSize: '15px',
                            fontWeight: '600',
                            transition: 'all 0.3s'
                        }}
                    >
                        Log In
                    </button>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section style={{
                position: 'relative',
                zIndex: 1,
                padding: '40px 24px 80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '40px'
            }}>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    textAlign: 'center'
                }}>
                    Five Ways to Think
                </h2>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '16px',
                    maxWidth: '800px'
                }}>
                    {FEATURES.map((f, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--glass)',
                                backdropFilter: 'blur(var(--glass-blur))',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '14px',
                                padding: '20px',
                                width: '145px',
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                animation: `fadeInUp 0.6s ease-out ${i * 0.1}s backwards`
                            }}
                        >
                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{f.icon}</div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '13px',
                                fontWeight: '700',
                                marginBottom: '6px'
                            }}>{f.title}</h3>
                            <p style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5
                            }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Auth Modal */}
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
