import React, { useState, useEffect } from 'react';

const NeuroAvatar = ({ state = 'idle', size = 40 }) => {
    // States: 'idle', 'thinking', 'happy', 'talking'

    // Animation keyframes injected via style
    const animStyles = `
        @keyframes neuroPulse {
            0% { transform: scale(1); box-shadow: 0 0 10px var(--accent-cyan); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px var(--accent-cyan), 0 0 40px rgba(0, 212, 255, 0.4); }
            100% { transform: scale(1); box-shadow: 0 0 10px var(--accent-cyan); }
        }
        @keyframes neuroThink {
            0% { transform: rotate(0deg); border-color: var(--accent-purple); }
            100% { transform: rotate(360deg); border-color: var(--accent-cyan); }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
        }
        @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
        }
    `;

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <style>{animStyles}</style>

            {/* Core Body */}
            <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #050709, #1a202c)',
                border: '2px solid var(--accent-cyan)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: state === 'thinking' ? 'neuroThink 1s linear infinite' : 'neuroPulse 3s infinite ease-in-out, float 6s ease-in-out infinite',
                transition: 'all 0.3s ease'
            }}>
                {/* Face/Eyes */}
                <div style={{
                    display: 'flex',
                    gap: size * 0.15,
                    alignItems: 'center'
                }}>
                    {/* Left Eye */}
                    <div style={{
                        width: size * 0.15,
                        height: state === 'happy' ? size * 0.08 : size * 0.2, // Squint if happy
                        background: 'var(--accent-cyan)',
                        borderRadius: state === 'happy' ? '4px' : '50%',
                        boxShadow: '0 0 10px var(--accent-cyan)',
                        animation: state !== 'thinking' ? 'blink 4s infinite 2s' : 'none'
                    }} />

                    {/* Right Eye */}
                    <div style={{
                        width: size * 0.15,
                        height: state === 'happy' ? size * 0.08 : size * 0.2,
                        background: 'var(--accent-cyan)',
                        borderRadius: state === 'happy' ? '4px' : '50%',
                        boxShadow: '0 0 10px var(--accent-cyan)'
                    }} />
                </div>

                {/* Mouth (Optional - for talking) */}
                {state === 'talking' && (
                    <div style={{
                        position: 'absolute',
                        bottom: size * 0.2,
                        width: size * 0.2,
                        height: size * 0.1,
                        background: 'var(--accent-cyan)',
                        borderRadius: '4px',
                        animation: 'pulse-glow 0.2s infinite' // rapid movement
                    }} />
                )}
            </div>

            {/* Orbiting particles (Electrons) */}
            {state === 'thinking' && (
                <div style={{
                    position: 'absolute',
                    top: -5, left: -5, right: -5, bottom: -5,
                    border: '1px dashed rgba(0, 212, 255, 0.3)',
                    borderRadius: '50%',
                    animation: 'spin 2s linear infinite reverse'
                }} />
            )}
        </div>
    );
};

export default NeuroAvatar;
