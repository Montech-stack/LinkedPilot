import React from 'react';
import { Plus } from 'lucide-react';
import styles from './Node.module.css';

const ExpandNode = ({ onClick, style }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        onClick && onClick();
    };

    return (
        <div
            className={`${styles.node} ${styles.expand}`}
            style={style}
            onClick={handleClick}
            title="Click to expand more topics"
        >
            <Plus size={24} />
        </div>
    );
};

export default ExpandNode;
