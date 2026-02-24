import React, { useRef, useState } from 'react';
import {
    X, Sparkles, Loader2, Send, MessageSquare, Minimize2, Maximize2,
    ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Copy, Check, Trash2
} from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';
import { askNodeQuestion } from '../../services/api';
import styles from './InfoPanel.module.css';

// ─── Markdown Formatter ───────────────────────────────────────────────
const parseInline = (text, accentColor) => {
    if (!text) return text;
    // Match: ***bold italic***, **bold**, *italic*, `code`
    const regex = /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            // Clean stray asterisks from plain text segments
            parts.push(text.slice(lastIndex, match.index).replace(/\*/g, ''));
        }
        const raw = match[0];
        if (raw.startsWith('***')) {
            parts.push(<strong key={match.index}><em>{raw.slice(3, -3)}</em></strong>);
        } else if (raw.startsWith('**')) {
            parts.push(<strong key={match.index} style={{ color: 'var(--text)', fontWeight: 700 }}>{raw.slice(2, -2)}</strong>);
        } else if (raw.startsWith('*')) {
            parts.push(<em key={match.index}>{raw.slice(1, -1)}</em>);
        } else if (raw.startsWith('`')) {
            parts.push(
                <code key={match.index} style={{
                    background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: '4px',
                    fontFamily: 'var(--font-mono)', fontSize: '0.88em', color: 'var(--accent-cyan)'
                }}>{raw.slice(1, -1)}</code>
            );
        }
        lastIndex = match.index + raw.length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex).replace(/\*/g, ''));
    }
    return parts.length === 0 ? text : parts;
};

const formatMessage = (text, accentColor) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // H3 heading
        if (line.startsWith('### ')) {
            elements.push(
                <h4 key={i} style={{ margin: '10px 0 4px', fontSize: '13px', fontWeight: 700, color: accentColor, fontFamily: 'var(--font-display)' }}>
                    {parseInline(line.slice(4), accentColor)}
                </h4>
            );
        }
        // H2 heading
        else if (line.startsWith('## ')) {
            elements.push(
                <h3 key={i} style={{ margin: '10px 0 5px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {parseInline(line.slice(3), accentColor)}
                </h3>
            );
        }
        // H1 heading
        else if (line.startsWith('# ')) {
            elements.push(
                <h2 key={i} style={{ margin: '10px 0 6px', fontSize: '15px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {parseInline(line.slice(2), accentColor)}
                </h2>
            );
        }
        // Numbered list item
        else if (/^\d+\.\s/.test(line)) {
            const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
                elements.push(
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', alignItems: 'flex-start' }}>
                        <span style={{
                            color: accentColor, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            fontSize: '11px', marginTop: '2px', flexShrink: 0, minWidth: '16px'
                        }}>{numMatch[1]}.</span>
                        <span style={{ flex: 1 }}>{parseInline(numMatch[2], accentColor)}</span>
                    </div>
                );
            }
        }
        // Bullet list (- or *)
        else if (/^[\s]*[-•]\s/.test(line)) {
            elements.push(
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start' }}>
                    <span style={{ color: accentColor, flexShrink: 0, marginTop: '1px' }}>•</span>
                    <span style={{ flex: 1 }}>{parseInline(line.replace(/^[\s]*[-•]\s+/, ''), accentColor)}</span>
                </div>
            );
        }
        // Empty line
        else if (line.trim() === '') {
            elements.push(<div key={i} style={{ height: '5px' }} />);
        }
        // Regular paragraph
        else {
            elements.push(
                <p key={i} style={{ margin: '0 0 5px', lineHeight: 1.6 }}>
                    {parseInline(line, accentColor)}
                </p>
            );
        }
        i++;
    }
    return elements;
};

// ─── Copy Button Component ─────────────────────────────────────────────
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {}
    };
    return (
        <button className={styles.copyBtn} onClick={handleCopy} title="Copy message">
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
};

// ─── Main InfoPanel Component ──────────────────────────────────────────
const InfoPanel = ({
    node,
    isOpen,
    onClose,
    onExpand,
    onCollapse,
    onNavigate,         // (dx, dy) → parent/child nav
    onNavigateSibling,  // (dir: -1 | 1) → sibling nav inside panel
    connections,
    loading,
    topic,
    mode,
    messages,           // Managed externally by App.jsx per nodeId
    onMessagesChange,   // Callback to update messages
    onClearChat,        // Callback to clear chat for current node
    parentChain,        // Array of parent node data from root→current
}) => {
    const [panelExpanded, setPanelExpanded] = useState(false);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const scrollRef = useRef(null);
    const prevNodeIdRef = useRef(null);

    // Clear input when switching nodes (keep panel open, keep messages, just clear input)
    const nodeId = node?.id;
    React.useEffect(() => {
        if (nodeId && nodeId !== prevNodeIdRef.current) {
            setQuestion('');
            setAsking(false);
            prevNodeIdRef.current = nodeId;
        }
    }, [nodeId]);

    const visible = isOpen && !!node;
    const msgs = messages || [];

    const { title, category, detail, type, icon, color } = node?.data || {};
    const accentColor = color || 'var(--accent-cyan)';

    const scrollToBottom = () => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 50);
        }
    };

    const handleAsk = async (e) => {
        e?.preventDefault();
        const q = question.trim();
        if (!q || asking) return;

        const newMessages = [...msgs, { type: 'user', content: q }];
        // Add a streaming placeholder
        const streamingMsgs = [...newMessages, { type: 'ai', content: '', streaming: true }];
        onMessagesChange(streamingMsgs);
        setQuestion('');
        setAsking(true);
        scrollToBottom();

        try {
            let finalText = '';
            await askNodeQuestion(node, q, topic, mode, parentChain || [], (partial) => {
                finalText = partial;
                onMessagesChange([
                    ...newMessages,
                    { type: 'ai', content: partial, streaming: true }
                ]);
            });
            onMessagesChange([
                ...newMessages,
                { type: 'ai', content: finalText, streaming: false }
            ]);
        } catch (err) {
            onMessagesChange([
                ...newMessages,
                { type: 'ai', content: "Sorry, I couldn't get an answer right now. Please try again.", streaming: false }
            ]);
        } finally {
            setAsking(false);
            scrollToBottom();
        }
    };

    const handleTellMeMore = async () => {
        if (asking) return;
        const q = `Tell me more about "${node?.data?.title}" — go deep, give me everything interesting, surprising, and important about it.`;
        const newMessages = [...msgs, { type: 'user', content: `Tell me more about "${node?.data?.title}"` }];
        const streamingMsgs = [...newMessages, { type: 'ai', content: '', streaming: true }];
        onMessagesChange(streamingMsgs);
        setAsking(true);
        scrollToBottom();

        try {
            let finalText = '';
            await askNodeQuestion(node, q, topic, mode, parentChain || [], (partial) => {
                finalText = partial;
                onMessagesChange([...newMessages, { type: 'ai', content: partial, streaming: true }]);
            });
            onMessagesChange([...newMessages, { type: 'ai', content: finalText, streaming: false }]);
        } catch (err) {
            onMessagesChange([...newMessages, { type: 'ai', content: "Sorry, couldn't get an answer right now.", streaming: false }]);
        } finally {
            setAsking(false);
            scrollToBottom();
        }
    };

    // Calculate close button x position dynamically
    const panelWidth = panelExpanded
        ? Math.min(window.innerWidth * 0.72, window.innerWidth - 40)
        : Math.min(450, window.innerWidth - 40);
    const closeButtonRight = 20 + panelWidth + 12;

    // Check if this node is already expanded (has children)
    const isNodeExpanded = connections && node && connections.some(c => {
        const fromId = typeof c.from === 'string' ? c.from : c.from?.id;
        return fromId === node.id;
    });

    if (!node && !isOpen) return null;

    return (
        <>
            {/* External Close Button — floats to the LEFT of the panel */}
            <button
                className={`${styles.externalClose} ${visible ? styles.externalCloseVisible : ''}`}
                onClick={onClose}
                title="Close panel"
                style={{ right: `${closeButtonRight}px` }}
            >
                <X size={14} />
            </button>

            {/* Main Panel */}
            <div className={`${styles.panel} ${visible ? styles.visible : ''} ${panelExpanded ? styles.expanded : ''}`}>

                {/* Gradient accent bar */}
                <div style={{
                    height: '3px',
                    background: `linear-gradient(90deg, ${accentColor}, var(--accent-purple), ${accentColor})`,
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 4s ease infinite',
                    flexShrink: 0
                }} />

                {/* ── Sticky Header (title + nav controls — never scrolls) ── */}
                <div className={styles.stickyHeader}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        {/* Title block */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {category && (
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '9px', textTransform: 'uppercase',
                                    color: accentColor, marginBottom: '5px', letterSpacing: '1.5px', opacity: 0.8
                                }}>
                                    {category}
                                </div>
                            )}
                            <h2 style={{
                                fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '800',
                                margin: 0, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '7px',
                                wordBreak: 'break-word'
                            }}>
                                {icon && <span style={{ fontSize: '19px', flexShrink: 0 }}>{icon}</span>}
                                {title}
                            </h2>
                        </div>

                        {/* Nav controls */}
                        <div className={styles.navBtnGroup}>
                            <button
                                className={styles.navBtn}
                                onClick={() => onNavigateSibling && onNavigateSibling(-1)}
                                title="Previous sibling"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <button
                                className={styles.navBtn}
                                onClick={() => onNavigateSibling && onNavigateSibling(1)}
                                title="Next sibling"
                            >
                                <ChevronRight size={13} />
                            </button>
                            <button
                                className={styles.navBtn}
                                onClick={() => onNavigate && onNavigate(0, -1)}
                                title="Go to parent"
                            >
                                <ChevronUp size={13} />
                            </button>
                            <button
                                className={styles.navBtn}
                                onClick={() => onNavigate && onNavigate(0, 1)}
                                title="Go to child"
                            >
                                <ChevronDown size={13} />
                            </button>
                            <button
                                className={styles.navBtn}
                                onClick={() => setPanelExpanded(e => !e)}
                                title={panelExpanded ? 'Shrink panel' : 'Expand panel'}
                                style={{ marginLeft: '2px' }}
                            >
                                {panelExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className={styles.scrollArea} ref={scrollRef}>

                    {/* Detail text */}
                    {detail && (
                        <div style={{
                            fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.65,
                            color: 'var(--text-secondary)', margin: '0 0 12px 0'
                        }}>
                            {formatMessage(detail, accentColor)}
                        </div>
                    )}

                    {/* Tell me more */}
                    <button className={styles.moreButton} onClick={handleTellMeMore} disabled={asking}>
                        <MessageSquare size={11} />
                        Tell me more
                    </button>

                    {/* Expand / Collapse button */}
                    {(type === 'branch' || type === 'sub') && (
                        <button
                            onClick={() => isNodeExpanded ? onCollapse(node.id) : onExpand(node.id)}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '10px 16px',
                                background: isNodeExpanded
                                    ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
                                    : 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.06))',
                                border: `1px solid ${isNodeExpanded ? 'rgba(239,68,68,0.25)' : 'rgba(0,212,255,0.25)'}`,
                                borderRadius: '10px',
                                color: isNodeExpanded ? '#ef4444' : 'var(--accent-cyan)',
                                cursor: loading ? 'wait' : 'pointer',
                                fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s var(--ease-smooth)', margin: '6px 0 4px 0'
                            }}
                        >
                            {loading ? (
                                <><Loader2 size={13} className="animate-spin" /> Expanding...</>
                            ) : isNodeExpanded ? (
                                <><Minimize2 size={13} /> Retract</>
                            ) : (
                                <><Sparkles size={13} /> Expand with Neuro</>
                            )}
                        </button>
                    )}

                    {/* ── Chat History ── */}
                    {msgs.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                            {/* Chat header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <NeuroAvatar state={asking ? 'thinking' : 'happy'} size={22} />
                                    <span style={{
                                        fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)',
                                        fontFamily: 'var(--font-display)', letterSpacing: '0.3px'
                                    }}>
                                        Chat with Neuro
                                    </span>
                                </div>
                                <button
                                    className={styles.clearBtn}
                                    onClick={onClearChat}
                                    title="Clear chat for this node"
                                >
                                    <Trash2 size={10} />
                                    Clear
                                </button>
                            </div>

                            {/* Messages */}
                            {msgs.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`${styles.message} ${msg.type === 'user' ? styles.userMessage : styles.aiMessage}`}
                                >
                                    <div className={styles.messageContent}>
                                        {msg.type === 'ai'
                                            ? (msg.content
                                                ? formatMessage(msg.content, accentColor)
                                                : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Thinking...</span>
                                            )
                                            : msg.content
                                        }
                                        {/* Streaming indicator */}
                                        {msg.streaming && (
                                            <span style={{ display: 'inline-block', marginLeft: '4px' }}>
                                                <Loader2 size={11} className="animate-spin" style={{ verticalAlign: 'middle', color: accentColor }} />
                                            </span>
                                        )}
                                    </div>
                                    {msg.type === 'ai' && msg.content && !msg.streaming && (
                                        <div className={styles.messageActions}>
                                            <CopyButton text={msg.content} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Thinking indicator (when no message placeholder yet) */}
                    {asking && msgs.length === 0 && (
                        <div className={`${styles.message} ${styles.aiMessage}`}>
                            <div className={styles.messageContent} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <Loader2 size={12} className="animate-spin" style={{ color: accentColor }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Input Area ── */}
                <div className={styles.inputArea}>
                    <form onSubmit={handleAsk} style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Ask Neuro anything..."
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            disabled={asking}
                            style={{
                                width: '100%',
                                padding: '11px 42px 11px 14px',
                                background: 'var(--surface)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '24px',
                                color: 'var(--text)',
                                fontSize: '13px',
                                fontFamily: 'var(--font-body)',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = accentColor}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        />
                        <button
                            type="submit"
                            disabled={!question.trim() || asking}
                            style={{
                                position: 'absolute', right: '6px', top: '50%',
                                transform: 'translateY(-50%)',
                                background: question.trim() ? accentColor : 'transparent',
                                border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                                color: question.trim() ? '#000' : 'var(--muted)',
                                cursor: question.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            {asking
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Send size={13} />
                            }
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default InfoPanel;
