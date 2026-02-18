import React, { useEffect } from 'react';
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
    return (
        <div
            className={styles.canvasContainer}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onWheel={onWheel}
            onClick={onClick}
            onDoubleClick={(e) => e.preventDefault()} // Prevent browser default zoom/select
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
