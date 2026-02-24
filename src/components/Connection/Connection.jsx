import React, { memo } from 'react';

const Connection = memo(({ fromX, fromY, toX, toY, type = 'default', color = '#00D4FF' }) => {
    if (fromX == null || toX == null) return null;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const cp1 = { x: fromX + dx * 0.4, y: fromY + dy * 0.1 };
    const cp2 = { x: toX - dx * 0.4, y: toY - dy * 0.1 };
    const pathData = `M ${fromX} ${fromY} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toX} ${toY}`;

    const gradientId = `grad-${Math.round(fromX)}-${Math.round(toX)}-${type}`;
    const glowId = `glow-${gradientId}`;

    let strokeDasharray = 'none';
    let opacity = 0.5;
    let strokeWidth = 1.5;
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
                top: 0, left: 0,
                width: '1px', height: '1px',
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

            <path
                d={pathData}
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                fill="none"
                className={type === 'expand' ? 'connection-flow' : ''}
            />
        </svg>
    );
});

Connection.displayName = 'Connection';
export default Connection;
