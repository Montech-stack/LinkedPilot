import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const DPad = ({ onNavigate, onReset }) => {
    const btnStyle = {
        background: 'var(--glass)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        color: 'var(--text)',
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.1s var(--ease-smooth)'
    };

    const handleDir = (dx, dy) => {
        if (onNavigate) onNavigate(dx, dy);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center'
        }}>
            {/* Directional Pad */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 40px 40px',
                gridTemplateRows: '40px 40px',
                gap: '4px'
            }}>
                <div />
                <button
                    onClick={() => handleDir(0, -1)}
                    style={btnStyle}
                    title="Navigate Up"
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronUp size={20} />
                </button>
                <div />

                <button
                    onClick={() => handleDir(-1, 0)}
                    style={btnStyle}
                    title="Navigate Left"
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={onReset}
                    style={{ ...btnStyle, background: 'var(--surface2)' }}
                    title="Reset View"
                >
                    <Maximize size={18} />
                </button>
                <button
                    onClick={() => handleDir(1, 0)}
                    style={btnStyle}
                    title="Navigate Right"
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronRight size={20} />
                </button>

                <div />
                <button
                    onClick={() => handleDir(0, 1)}
                    style={btnStyle}
                    title="Navigate Down"
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronDown size={20} />
                </button>
                <div />
            </div>

            {/* Zoom Controls REMOVED (Duplicate) */}
        </div>
    );
};

export default DPad;
