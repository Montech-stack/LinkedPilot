import React, { useEffect, useState, useRef } from 'react';
import { X, Sparkles, Loader2, Send, MessageSquare, Bot, Minimize2, ChevronUp, ChevronDown } from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';
import { askNodeQuestion } from '../../services/api';
import styles from './InfoPanel.module.css';

const InfoPanel = ({ node, onClose, onExpand, onCollapse, onNavigate, connections, loading, topic, mode }) => {
    const [visible, setVisible] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]); // Array of { type: 'user' | 'ai', content: string }
    const [asking, setAsking] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (node) {
            setVisible(true);
            setQuestion('');
            setMessages([]); // Reset chat on new node
        } else {
            setVisible(false);
        }
    }, [node]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, asking]);

    const handleAsk = async (e) => {
        e && e.preventDefault();
        const q = question.trim();
        if (!q || asking) return;

        // Add user message
        const newMessages = [...messages, { type: 'user', content: q }];
        setMessages(newMessages);
        setQuestion('');
        setAsking(true);

        try {
            const response = await askNodeQuestion(node, q, topic, mode);
            setMessages([...newMessages, { type: 'ai', content: response }]);
        } catch (err) {
            setMessages([...newMessages, { type: 'ai', content: "Sorry, I couldn't get an answer right now. Please try again." }]);
        } finally {
            setAsking(false);
        }
    };

    const handleTellMeMore = async () => {
        if (asking) return;

        const q = `Tell me more about "${node?.data?.title}"`;
        // Add user message (or system message style if preferred, making it user style for now)
        const newMessages = [...messages, { type: 'user', content: q }];
        setMessages(newMessages);
        setAsking(true);

        try {
            const response = await askNodeQuestion(node, q, topic, mode);
            setMessages([...newMessages, { type: 'ai', content: response }]);
        } catch (err) {
            setMessages([...newMessages, { type: 'ai', content: "Sorry, I couldn't get an answer right now. Please try again." }]);
        } finally {
            setAsking(false);
        }
    };

    if (!node && !visible) return null;

    const { title, category, detail, type, icon, color } = node?.data || {};
    const accentColor = color || 'var(--accent-cyan)';

    // Helper to format AI markdown-like text
    const formatMessage = (text) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <h4 key={i} style={{ margin: '8px 0 4px', fontSize: '14px', color: 'var(--text)' }}>{line.replace('### ', '')}</h4>;
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
            if (line.trim() === '') return <div key={i} style={{ height: '6px' }} />;
            return (
                <p key={i} style={{ margin: '0 0 6px' }}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                            ? <strong key={j} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                            : part
                    )}
                </p>
            );
        });
    };

    return (
        <div className={`${styles.panel} ${visible && node ? styles.visible : ''}`}>
            {/* Gradient Top Accent */}
            <div style={{
                height: '3px',
                background: `linear-gradient(90deg, ${accentColor}, var(--accent-purple), ${accentColor})`,
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 4s ease infinite',
                flexShrink: 0
            }} />

            {/* Scrollable Content Area */}
            <div className={styles.scrollArea} ref={scrollRef}>
                {/* Header Section */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                            {category && (
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase',
                                    color: accentColor, marginBottom: '6px', letterSpacing: '1.5px', opacity: 0.8
                                }}>
                                    {category}
                                </div>
                            )}
                            <h2 style={{
                                fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '800',
                                margin: 0, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
                                {title}
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {/* Navigation controls inside InfoPanel */}
                            <button
                                onClick={() => onNavigate && onNavigate(0, -1)}
                                style={{
                                    background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px',
                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                title="Go to Parent"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                onClick={() => onNavigate && onNavigate(0, 1)}
                                style={{
                                    background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px',
                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}
                                title="Go to Child"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <ChevronDown size={14} />
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'var(--surface2)', border: '1px solid var(--glass-border)',
                                    color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px',
                                    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s', marginLeft: '4px'
                                }}
                                title="Close"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '12px' }} />

                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.6,
                        color: 'var(--text-secondary)', margin: '0 0 12px 0'
                    }}>
                        {detail}
                    </p>

                    {/* "Tell Me More" Button */}
                    <button className={styles.moreButton} onClick={handleTellMeMore} disabled={asking}>
                        <MessageSquare size={12} />
                        Tell me more
                    </button>

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
                                    width: '100%', padding: '10px 16px',
                                    background: isExpanded
                                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.06))'
                                        : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(124, 58, 237, 0.06))',
                                    border: `1px solid ${isExpanded ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 212, 255, 0.2)'}`,
                                    borderRadius: '10px',
                                    color: isExpanded ? 'var(--accent-red, #EF4444)' : 'var(--accent-cyan)',
                                    cursor: loading ? 'wait' : 'pointer',
                                    fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.25s var(--ease-smooth)', letterSpacing: '0.3px', margin: '4px 0 16px 0'
                                }}
                            >
                                {loading ? (
                                    <> <Loader2 size={14} className="animate-spin" /> Expanding... </>
                                ) : isExpanded ? (
                                    <> <Minimize2 size={14} /> Unexpand </>
                                ) : (
                                    <> <Sparkles size={14} /> Expand with Neuro </>
                                )}
                            </button>
                        );
                    })()}
                </div>

                {/* Chat History */}
                {messages.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <NeuroAvatar state={asking ? 'thinking' : 'happy'} size={24} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                                Chat with Neuro
                            </span>
                        </div>

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`${styles.message} ${msg.type === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                <div className={styles.messageContent}>
                                    {msg.type === 'ai' ? formatMessage(msg.content) : msg.content}
                                </div>
                            </div>
                        ))}

                        {asking && (
                            <div className={`${styles.message} ${styles.aiMessage}`}>
                                <div className={styles.messageContent} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thinking...</span>
                                    <Loader2 size={12} className="animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Fixed Input Area */}
            <div className={styles.inputArea}>
                <form onSubmit={handleAsk} style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Ask Neuro..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={asking}
                        style={{
                            width: '100%',
                            padding: '12px 40px 12px 14px',
                            background: 'var(--surface)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '24px',
                            color: 'var(--text)',
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            outline: 'none',
                            boxSizing: 'border-box',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
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
                            background: 'var(--accent-cyan)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            color: '#000',
                            cursor: question.trim() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: question.trim() ? 1 : 0.5,
                            transition: 'all 0.2s'
                        }}
                    >
                        {asking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InfoPanel;
