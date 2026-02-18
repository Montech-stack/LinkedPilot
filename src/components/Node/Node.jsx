import React from 'react';
import styles from './Node.module.css';

const Node = ({ data, onClick, style }) => {
    const { type, title, category, summary, icon, color } = data;

    // Dynamic style for color variations
    const dynamicStyle = {
        ...style,
        '--node-color': color,
        '--node-glow': `${color}30`,
    };

    const handleClick = (e) => {
        e.stopPropagation();
        onClick && onClick(data);
    };

    if (type === 'central') {
        return (
            <div
                className={`${styles.node} ${styles.central}`}
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
                className={`${styles.node} ${styles.branch}`}
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
                className={`${styles.node} ${styles.sub}`}
                style={dynamicStyle}
                onClick={handleClick}
            >
                <div className={styles.subTitle}>{title}</div>
            </div>
        );
    }

    return null;
};

export default Node;
