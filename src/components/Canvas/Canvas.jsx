import React, { useEffect, useRef } from 'react';
import styles from './Canvas.module.css';

const Canvas = ({
    children,
    scale,
    offset,
    onWheel,
    onMouseDown,
    onMouseMove,
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}) => {
    const containerRef = useRef(null);

    // Must use non-passive listeners so we can call preventDefault
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const wheelHandler = (e) => { e.preventDefault(); onWheel?.(e); };
        const touchMoveHandler = (e) => { e.preventDefault(); onTouchMove?.(e); };

        el.addEventListener('wheel', wheelHandler, { passive: false });
        el.addEventListener('touchmove', touchMoveHandler, { passive: false });

        return () => {
            el.removeEventListener('wheel', wheelHandler);
            el.removeEventListener('touchmove', touchMoveHandler);
        };
    }, [onWheel, onTouchMove]);

    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onClick={onClick}
            onDoubleClick={(e) => e.preventDefault()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div
                className={styles.world}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                }}
            >
                {children}
            </div>

            <div className={styles.background} />
        </div>
    );
};

export default Canvas;
