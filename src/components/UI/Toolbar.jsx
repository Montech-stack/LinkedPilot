import React from 'react';
import { Plus, Minus, RotateCcw, Trophy, Share2 } from 'lucide-react';

const Toolbar = ({ onZoomIn, onZoomOut, onReset, onQuiz, onShare, shareLoading }) => {
    const btnStyle = {
        background: 'var(--glass)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-secondary)',
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s var(--ease-smooth)'
    };

    const handleHover = (e, enter) => {
        if (enter) {
            e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            e.currentTarget.style.color = 'var(--accent-cyan)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.1)';
        } else {
            e.currentTarget.style.background = 'var(--glass)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.boxShadow = 'none';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '80px',
            zIndex: 100,
            display: 'flex',
            gap: '6px',
            padding: '6px',
            background: 'var(--glass)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            border: '1px solid var(--glass-border)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-md)'
        }}>
            <button
                style={{ ...btnStyle, opacity: shareLoading ? 0.6 : 1, pointerEvents: shareLoading ? 'none' : 'auto' }}
                onClick={onShare}
                title="Share Map"
                onMouseEnter={(e) => !shareLoading && handleHover(e, true)}
                onMouseLeave={(e) => !shareLoading && handleHover(e, false)}
            >
                {shareLoading ? (
                    <svg
                        width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="var(--accent-purple)" strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ animation: 'spin 0.8s linear infinite' }}
                    >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                ) : (
                    <Share2 size={16} color="var(--accent-purple)" />
                )}
            </button>
            <div style={{ width: '1px', background: 'var(--glass-border)', margin: '4px 2px' }} />
            <button
                style={{
                    ...btnStyle,
                    width: 'auto',
                    padding: '0 12px',
                    gap: '6px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '600'
                }}
                onClick={onQuiz}
                title="Start Neuro Quiz"
                onMouseEnter={(e) => handleHover(e, true)}
                onMouseLeave={(e) => handleHover(e, false)}
            >
                <Trophy size={16} color="var(--accent-yellow)" />
                <span style={{ color: 'inherit' }}>Quiz</span>
            </button>
            <div style={{ width: '1px', background: 'var(--glass-border)', margin: '4px 2px' }} />
            <button
                style={btnStyle}
                onClick={onZoomIn}
                title="Zoom In"
                onMouseEnter={(e) => handleHover(e, true)}
                onMouseLeave={(e) => handleHover(e, false)}
            >
                <Plus size={16} />
            </button>
            <button
                style={btnStyle}
                onClick={onZoomOut}
                title="Zoom Out"
                onMouseEnter={(e) => handleHover(e, true)}
                onMouseLeave={(e) => handleHover(e, false)}
            >
                <Minus size={16} />
            </button>
            <div style={{ width: '1px', background: 'var(--glass-border)', margin: '4px 2px' }} />
            <button
                style={btnStyle}
                onClick={onReset}
                title="Reset View"
                onMouseEnter={(e) => handleHover(e, true)}
                onMouseLeave={(e) => handleHover(e, false)}
            >
                <RotateCcw size={15} />
            </button>
        </div>
    );
};

export default Toolbar;
