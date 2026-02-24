import React, { memo } from 'react';
import styles from './Node.module.css';

const Node = memo(({ nodeData, isSelected, onClick }) => {
    const { id, type, x, y, data } = nodeData;
    const { title, category, summary, icon, color, rank } = data;

    const dynamicStyle = {
        left: x,
        top: y,
        '--node-color': color,
        '--node-glow': `${color}30`,
    };

    const handleClick = (e) => {
        e.stopPropagation();
        onClick && onClick(nodeData);
    };

    if (type === 'central') {
        return (
            <div
                className={`${styles.node} ${styles.central} ${isSelected ? styles.selected : ''}`}
                style={dynamicStyle}
                onClick={handleClick}
            >
                <div className={styles.centralIcon}>{icon}</div>
                <div className={styles.centralTitle}>{title}</div>
            </div>
        );
    }

    if (type === 'branch') {
        return (
            <div
                className={`${styles.node} ${styles.branch} ${isSelected ? styles.selected : ''}`}
                style={dynamicStyle}
                onClick={handleClick}
            >
                <div className={styles.branchCategory}>
                    {icon && <span style={{ marginRight: '4px', fontSize: '11px' }}>{icon}</span>}
                    {category}
                </div>
                <div className={styles.branchTitle}>{title}</div>
                {summary && <div className={styles.branchSummary}>{summary}</div>}
            </div>
        );
    }

    if (type === 'sub') {
        return (
            <div
                className={`${styles.node} ${styles.sub} ${isSelected ? styles.selected : ''}`}
                style={dynamicStyle}
                onClick={handleClick}
            >
                {rank && (
                    <span className={styles.rankBadge} style={{ '--node-color': color }}>
                        {rank}
                    </span>
                )}
                <div className={styles.subTitle}>{title}</div>
            </div>
        );
    }

    return null;
});

Node.displayName = 'Node';
export default Node;
