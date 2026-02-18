import React from 'react';

const Connection = ({ from, to, type = 'default', color = '#00D4FF' }) => {
    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Smooth bezier control points
    const cp1 = { x: from.x + dx * 0.4, y: from.y + dy * 0.1 };
    const cp2 = { x: to.x - dx * 0.4, y: to.y - dy * 0.1 };

    const pathData = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;

    // Unique ID for gradients
    const gradientId = `grad-${from.x.toFixed(0)}-${to.x.toFixed(0)}-${type}`;
    const glowId = `glow-${gradientId}`;

    // Style config per type
    let strokeDasharray = 'none';
    let opacity = 0.5;
    let strokeWidth = 1.5;
    let stroke = color;
    let fromColor = color;
    let toColor = color;
    let useGlow = false;

    if (type === 'central') {
        fromColor = '#00D4FF';
        toColor = color || '#7C3AED';
        opacity = 0.45;
        strokeWidth = 1.8;
        useGlow = true;
    } else if (type === 'sub') {
        fromColor = color;
        toColor = color;
        opacity = 0.35;
        strokeWidth = 1.2;
    } else if (type === 'expand') {
        fromColor = '#00D4FF';
        toColor = '#7C3AED';
        strokeDasharray = '5 4';
        opacity = 0.6;
        strokeWidth = 1.5;
    }

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1px',
                height: '1px',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: -1
            }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={fromColor} stopOpacity={opacity} />
                    <stop offset="100%" stopColor={toColor} stopOpacity={opacity * 0.6} />
                </linearGradient>
                {useGlow && (
                    <filter id={glowId}>
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
            </defs>

            {/* Glow underlayer */}
            {useGlow && (
                <path
                    d={pathData}
                    stroke={fromColor}
                    strokeWidth={strokeWidth + 3}
                    fill="none"
                    opacity={opacity * 0.15}
                    filter={`url(#${glowId})`}
                />
            )}

            {/* Main path */}
            <path
                d={pathData}
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                fill="none"
                className={type === 'expand' ? 'connection-flow' : ''}
            >
                {type === 'expand' && (
                    <animate
                        attributeName="stroke-dashoffset"
                        from="100"
                        to="0"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                )}
            </path>
        </svg>
    );
};

export default Connection;
