import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, Loader2, Send, MessageSquare, Bot, Minimize2 } from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';
import { askNodeQuestion } from '../../services/api';
import styles from './InfoPanel.module.css';

const InfoPanel = ({ node, onClose, onExpand, onCollapse, connections, loading, topic, mode }) => {
    const [visible, setVisible] = useState(false);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [asking, setAsking] = useState(false);
    const answerRef = useRef(null);

    useEffect(() => {
        if (node) {
            setVisible(true);
            setQuestion('');
            setAnswer('');
        } else {
            setVisible(false);
        }
    }, [node]);

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!question.trim() || asking) return;

        setAsking(true);
        setAnswer('');

        try {
            const response = await askNodeQuestion(node, question, topic, mode);
            setAnswer(response);
            // Scroll to answer
            setTimeout(() => {
                answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (err) {
            setAnswer("Sorry, I couldn't get an answer right now. Please try again.");
        } finally {
            setAsking(false);
        }
    };

    if (!node && !visible) return null;

    const { title, category, detail, type, icon, color } = node?.data || {};
    const accentColor = color || 'var(--accent-cyan)';

    return (
        <div
            className={`${styles.panel} ${visible && node ? styles.visible : ''}`}
        >
            {/* Gradient Top Accent */}
            <div style={{
                height: '3px',
                background: `linear-gradient(90deg, ${accentColor}, var(--accent-purple), ${accentColor})`,
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 4s ease infinite',
                flexShrink: 0
            }} />

            <div className={styles.contentContainer}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexShrink: 0 }}>
                    <div style={{ flex: 1 }}>
                        {category && (
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                color: accentColor,
                                marginBottom: '6px',
                                letterSpacing: '1.5px',
                                opacity: 0.8
                            }}>
                                {category}
                            </div>
                        )}
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '17px',
                            fontWeight: '800',
                            margin: 0,
                            lineHeight: 1.3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface2)';
                            e.currentTarget.style.color = 'var(--text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--surface2)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Divider */}
                <div style={{
                    height: '1px',
                    background: 'var(--glass-border)',
                    flexShrink: 0
                }} />

                {/* Detail Text */}
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12.5px',
                    lineHeight: 1.75,
                    color: 'var(--text-secondary)',
                    margin: 0
                }}>
                    {detail}
                </p>

                {/* Expand / Unexpand Button */}
                {(type === 'branch' || type === 'sub') && (() => {
                    const isExpanded = connections && node && connections.some(c => {
                        const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
                        return fromId === node.id;
                    });
                    return (
                        <button
                            onClick={() => isExpanded ? onCollapse(node.id) : onExpand(node.id)}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: isExpanded
                                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.06))'
                                    : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.06))',
                                border: `1px solid ${isExpanded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 212, 255, 0.2)'}`,
                                borderRadius: '10px',
                                color: isExpanded ? 'var(--accent-red, #EF4444)' : 'var(--accent-cyan)',
                                cursor: loading ? 'wait' : 'pointer',
                                fontFamily: 'var(--font-display)',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.25s var(--ease-smooth)',
                                letterSpacing: '0.3px',
                                marginBottom: '16px',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    if (isExpanded) {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(239, 68, 68, 0.12))';
                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                    } else {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.18), rgba(124, 58, 237, 0.12))';
                                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-glow-cyan)';
                                    }
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isExpanded) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.06))';
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                } else {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.06))';
                                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                                }
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Expanding...
                                </>
                            ) : isExpanded ? (
                                <>
                                    <Minimize2 size={14} />
                                    Unexpand
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    Expand with Neuro
                                </>
                            )}
                        </button>
                    );
                })()}

                {/* Q&A Section */}
                <div style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <NeuroAvatar state={asking ? 'thinking' : (answer ? 'happy' : 'idle')} size={32} />
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: 'var(--text)',
                            fontFamily: 'var(--font-display)'
                        }}>
                            Ask Neuro
                        </span>
                    </div>

                    {answer && (
                        <div
                            ref={answerRef}
                            style={{
                                background: 'var(--surface2)',
                                borderRadius: '10px',
                                padding: '16px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: 'var(--text)',
                                borderLeft: `3px solid ${accentColor}`,
                                animation: 'fadeInUp 0.3s ease-out'
                            }}
                        >
                            {answer.split('\n').map((line, i) => {
                                // Headlines (using ### or similar if AI generates them, mostly standard markdown)
                                if (line.startsWith('### ')) return <h4 key={i} style={{ margin: '12px 0 6px', fontSize: '14px', color: 'var(--text)' }}>{line.replace('### ', '')}</h4>;
                                // List items
                                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: '8px', marginLeft: '4px', marginBottom: '4px' }}>
                                            <span style={{ color: accentColor }}>•</span>
                                            <span>
                                                {line.replace(/^[\-\*]\s+/, '').split(/(\*\*.*?\*\*)/).map((part, j) =>
                                                    part.startsWith('**') && part.endsWith('**')
                                                        ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                                                        : part
                                                )}
                                            </span>
                                        </div>
                                    );
                                }
                                // Standard paragraphs with bold support
                                if (line.trim() === '') return <div key={i} style={{ height: '8px' }} />;
                                return (
                                    <p key={i} style={{ margin: '0 0 8px' }}>
                                        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                                            part.startsWith('**') && part.endsWith('**')
                                                ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                                                : part
                                        )}
                                    </p>
                                );
                            })}
                        </div>
                    )}

                    <form onSubmit={handleAsk} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={asking}
                            style={{
                                width: '100%',
                                padding: '10px 36px 10px 12px',
                                background: 'var(--surface2)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '13px',
                                fontFamily: 'var(--font-body)',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!question.trim() || asking}
                            style={{
                                position: 'absolute',
                                right: '6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: question.trim() ? accentColor : 'var(--muted)',
                                cursor: question.trim() ? 'pointer' : 'default',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                            }}
                        >
                            {asking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;
