import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';
import { MODE_LIST, DEFAULT_MODE, getModeIcon } from '../../config/modes';

const SUGGESTIONS = [
    "Quantum Computing",
    "Machine Learning",
    "Climate Change",
    "Blockchain Technology",
    "Human Psychology",
    "Space Exploration",
    "Artificial Intelligence",
    "Genetic Engineering"
];

const InputOverlay = ({ onSubmit, loading }) => {
    const [value, setValue] = useState('');
    const [selectedMode, setSelectedMode] = useState(DEFAULT_MODE);
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowPlaceholder(false);
            setTimeout(() => {
                setPlaceholderIdx(prev => (prev + 1) % SUGGESTIONS.length);
                setShowPlaceholder(true);
            }, 300);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const isDataMode = selectedMode === 'data-integration';
    const canSubmit = !loading && (isDataMode || value.trim());

    const handleSubmit = (e) => {
        e.preventDefault();
        if (canSubmit) {
            onSubmit(value.trim() || 'My Data', selectedMode);
        }
    };

    const activeMode = MODE_LIST.find(m => m.id === selectedMode);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleTextareaChange = (e) => {
        setValue(e.target.value);
        // Auto-resize logic
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '28px',
            pointerEvents: 'none',
            zIndex: 100
        }}>
            {/* Hero Title */}
            <div style={{
                pointerEvents: 'none',
                textAlign: 'center',
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                }}>
                    <NeuroAvatar state="idle" size={28} />
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '32px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, var(--text) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 5s ease infinite',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        Neuro
                    </h1>
                </div>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    fontWeight: '400',
                    letterSpacing: '0.2px'
                }}>
                    Turn any topic into a visual knowledge universe
                </p>
            </div>

            {/* Mode Selector */}
            <div style={{
                pointerEvents: 'auto',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '560px',
                animation: 'fadeInUp 0.8s ease-out 0.1s backwards'
            }}>
                {MODE_LIST.map(mode => {
                    const Icon = getModeIcon(mode.id);
                    const isActive = selectedMode === mode.id;
                    return (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: `1px solid ${isActive ? mode.color : 'var(--glass-border)'}`,
                                background: isActive
                                    ? `linear-gradient(135deg, ${mode.color}18, ${mode.color}08)`
                                    : 'var(--glass)',
                                backdropFilter: 'blur(var(--glass-blur))',
                                WebkitBackdropFilter: 'blur(var(--glass-blur))',
                                color: isActive ? mode.color : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: 'var(--font-body)',
                                fontWeight: isActive ? '600' : '400',
                                transition: 'all 0.2s var(--ease-smooth)',
                                boxShadow: isActive ? `0 0 15px ${mode.color}20` : 'none'
                            }}
                            title={mode.description}
                        >
                            <span style={{ fontSize: '14px' }}>{mode.emoji}</span>
                            {mode.label}
                            {mode.beta && (
                                <span style={{
                                    fontSize: '7px',
                                    fontWeight: '800',
                                    background: 'linear-gradient(135deg, #F97316, #EC4899)',
                                    color: '#fff',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.8px',
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}>BETA</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Mode Description */}
            {activeMode && (
                <p style={{
                    pointerEvents: 'none',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    animation: 'fadeInUp 0.4s ease-out',
                    marginTop: '-16px'
                }}>
                    {activeMode.description}
                </p>
            )}

            {/* Search Input */}
            <form
                onSubmit={handleSubmit}
                style={{
                    pointerEvents: 'auto',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '6px 8px 6px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(0, 212, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
                    maxWidth: '520px',
                    width: '90%',
                    transition: 'all 0.3s var(--ease-smooth)',
                    animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
                }}
            >
                {loading
                    ? <Loader2 className="animate-spin" size={20} color="var(--accent-cyan)" />
                    : <Search size={18} color="var(--muted)" />
                }

                <textarea
                    value={value}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isDataMode ? 'Click Explore to upload your Document/Database...' :
                            selectedMode === 'connect' ? 'Enter two or more topics to connect (e.g. AI + Biology)...' :
                                `Explore "${SUGGESTIONS[placeholderIdx]}"...`
                    }
                    disabled={loading || isDataMode}
                    autoFocus
                    rows={1}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text)',
                        fontSize: '15px',
                        fontFamily: 'var(--font-body)',
                        fontWeight: '400',
                        width: '100%',
                        padding: '12px 0',
                        resize: 'none',
                        maxHeight: '35vh',
                        overflowY: 'auto',
                        transition: 'opacity 0.3s',
                        opacity: showPlaceholder || value || isDataMode ? 1 : 0.7,
                        lineHeight: '1.5'
                    }}
                />

                <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{
                        background: canSubmit
                            ? `linear-gradient(135deg, ${activeMode?.color || 'var(--accent-cyan)'}, #0EA5E9)`
                            : 'rgba(255, 255, 255, 0.06)',
                        color: canSubmit ? '#050709' : 'var(--muted)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        transition: 'all 0.25s var(--ease-smooth)',
                        fontFamily: 'var(--font-display)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        boxShadow: canSubmit ? `0 0 20px ${activeMode?.color || 'var(--accent-cyan)'}33` : 'none'
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            Explore
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default InputOverlay;
