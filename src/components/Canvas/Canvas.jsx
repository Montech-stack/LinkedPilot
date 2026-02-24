import React, { useEffect, useRef } from 'react';
import styles from './Canvas.module.css';

const Canvas = ({
    children,
    scale,
    offset,
    onWheel,
    onMouseDown,
    onMouseMove,
    onClick
}) => {
    const containerRef = useRef(null);

    // Attach wheel with passive:false so preventDefault works
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !onWheel) return;
        const handler = (e) => { e.preventDefault(); onWheel(e); };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [onWheel]);

    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onClick={onClick}
            onDoubleClick={(e) => e.preventDefault()}
        >
            <div
                className={styles.world}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                }}
            >
                {children}
            </div>

            {/* Background layer: Star field texture */}
            <div className={styles.background} />
        </div>
    );
};

export default Canvas;
