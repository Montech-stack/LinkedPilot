import React, { memo } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import styles from './Node.module.css';

// ─── Expand / Retract button ──────────────────────────────────────────
const ExpandButton = ({ nodeId, isExpanded, isLoading, onExpand, onCollapse, color }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        if (isLoading) return;
        if (isExpanded) onCollapse?.(nodeId);
        else onExpand?.(nodeId);
    };

    let cls = styles.expandBtn;
    if (isLoading) cls += ` ${styles.loadingBtn}`;
    else if (isExpanded) cls += ` ${styles.retractBtn}`;

    return (
        <button
            className={cls}
            onClick={handleClick}
            title={isLoading ? 'Loading…' : isExpanded ? 'Retract' : 'Expand with Neuro'}
            style={{ '--node-color': color }}
        >
            {isLoading
                ? <Loader2 size={11} className="animate-spin" />
                : isExpanded
                    ? <Minus size={11} />
                    : <Plus size={11} />
            }
        </button>
    );
};

// ─── Main Node ────────────────────────────────────────────────────────
const Node = memo(({ nodeData, isSelected, onClick, isExpanded, isLoading, onExpand, onCollapse }) => {
    const { id, type, x, y, data } = nodeData;
    const { title, category, summary, icon, color, rank, branchIndex } = data;

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

    // ── Central ──────────────────────────────────────────────────────
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

    // ── Branch ───────────────────────────────────────────────────────
    if (type === 'branch') {
        const unexpanded = !isExpanded && !isLoading;
        return (
            <div
                className={`${styles.node} ${styles.branch} ${isSelected ? styles.selected : ''} ${unexpanded ? styles.unexpanded : ''}`}
                style={dynamicStyle}
                onClick={handleClick}
            >
                {/* Exploration number badge */}
                {branchIndex != null && (
                    <span className={styles.branchNum}>{branchIndex}</span>
                )}

                <div className={styles.branchCategory}>
                    {icon && <span style={{ marginRight: '4px', fontSize: '11px' }}>{icon}</span>}
                    {category}
                </div>
                <div className={styles.branchTitle}>{title}</div>
                {summary && <div className={styles.branchSummary}>{summary}</div>}

                <ExpandButton
                    nodeId={id}
                    isExpanded={isExpanded}
                    isLoading={isLoading}
                    onExpand={onExpand}
                    onCollapse={onCollapse}
                    color={color}
                />
            </div>
        );
    }

    // ── Sub ──────────────────────────────────────────────────────────
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

                <ExpandButton
                    nodeId={id}
                    isExpanded={isExpanded}
                    isLoading={isLoading}
                    onExpand={onExpand}
                    onCollapse={onCollapse}
                    color={color}
                />
            </div>
        );
    }

    return null;
});

Node.displayName = 'Node';
export default Node;
