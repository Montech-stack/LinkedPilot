import React, { useState, useEffect } from 'react';
import { X, Trophy, Check, AlertCircle, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { generateQuiz } from '../../services/api';
import NeuroAvatar from './NeuroAvatar';

const RANKS = [
    { level: 1, title: "Neuro Novice", color: "#60A5FA" },
    { level: 2, title: "Synapse Seeker", color: "#34D399" },
    { level: 3, title: "Dendrite Drifter", color: "#FBBF24" },
    { level: 4, title: "Axon Adventurer", color: "#F472B6" },
    { level: 5, title: "Cortex Commander", color: "#A78BFA" },
    { level: 6, title: "Lobe Legend", color: "#F87171" },
    { level: 7, title: "Neuro Grandmaster", color: "#FCD34D" } // Gold
];

const QuizModal = ({ topic, onClose, onFindNode }) => {
    const [level, setLevel] = useState(1);
    const [loading, setLoading] = useState(false);
    const [questionData, setQuestionData] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [result, setResult] = useState(null); // 'correct' | 'incorrect'
    const [streak, setStreak] = useState(0);

    const loadLevel = async (lvl) => {
        setLoading(true);
        setQuestionData(null);
        setSelectedOption(null);
        setResult(null);
        try {
            const data = await generateQuiz(topic, RANKS[lvl - 1].title);
            setQuestionData(data);
        } catch (error) {
            console.error("Quiz Error:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadLevel(1);
    }, [topic]);

    const handleOptionClick = (index) => {
        if (result) return;
        setSelectedOption(index);

        if (index === questionData.correctIndex) {
            setResult('correct');
            setStreak(s => s + 1);
        } else {
            setResult('incorrect');
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (level < 7 && result === 'correct') {
            setLevel(l => l + 1);
            loadLevel(level + 1);
        } else {
            // Retry same level or close if finished
            if (result === 'incorrect') {
                loadLevel(level); // Retry
            } else {
                onClose(); // Finished
            }
        }
    };

    const currentRank = RANKS[level - 1];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(5, 7, 9, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '500px',
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '30px',
                position: 'relative',
                boxShadow: `0 0 40px ${currentRank.color}20`
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                        <NeuroAvatar state={result === 'correct' ? 'happy' : (loading ? 'thinking' : 'idle')} size={60} />
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '24px',
                        fontWeight: '800',
                        color: currentRank.color,
                        margin: '0 0 4px',
                        letterSpacing: '-0.5px'
                    }}>
                        Level {level}: {currentRank.title}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        Topic: <span style={{ color: 'var(--text)' }}>{topic}</span>
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                        <p>Neuro is crafting a challenge...</p>
                    </div>
                ) : questionData ? (
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                        <p style={{
                            fontSize: '16px',
                            lineHeight: '1.6',
                            fontWeight: '500',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            {questionData.question}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {questionData.options.map((opt, i) => {
                                let bg = 'var(--surface2)';
                                let border = 'var(--glass-border)';

                                if (selectedOption !== null) {
                                    if (i === questionData.correctIndex) {
                                        bg = 'rgba(16, 185, 129, 0.15)'; // Green
                                        border = '#10B981';
                                    } else if (i === selectedOption && result === 'incorrect') {
                                        bg = 'rgba(239, 68, 68, 0.15)'; // Red
                                        border = '#EF4444';
                                    }
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleOptionClick(i)}
                                        disabled={selectedOption !== null}
                                        style={{
                                            padding: '16px',
                                            background: bg,
                                            border: `1px solid ${border}`,
                                            borderRadius: '12px',
                                            color: 'var(--text)',
                                            fontSize: '14px',
                                            textAlign: 'left',
                                            cursor: selectedOption !== null ? 'default' : 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: 'var(--font-body)'
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback Area */}
                        {result && (
                            <div style={{ marginTop: '24px', textAlign: 'center', animation: 'fadeInUp 0.3s' }}>
                                <div style={{
                                    marginBottom: '12px',
                                    color: result === 'correct' ? '#10B981' : '#EF4444',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    {result === 'correct' ? <Check size={20} /> : <AlertCircle size={20} />}
                                    {result === 'correct' ? "Correct!" : "Not quite."}
                                </div>

                                {questionData.explanation && (
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '16px',
                                        background: 'var(--surface2)',
                                        padding: '12px',
                                        borderRadius: '8px'
                                    }}>
                                        {questionData.explanation}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    {result === 'incorrect' && (
                                        <button
                                            onClick={() => loadLevel(level)} // Retry same level
                                            style={{
                                                background: 'var(--surface2)',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text)',
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Try Again
                                        </button>
                                    )}

                                    <button
                                        onClick={() => onFindNode(topic)}
                                        style={{
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--accent-cyan)',
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        title="Find related node on map"
                                    >
                                        <MapPin size={16} /> Locate
                                    </button>

                                    {result === 'correct' && (
                                        <button
                                            onClick={handleNext}
                                            style={{
                                                background: 'var(--gradient-cyan)',
                                                border: 'none',
                                                color: '#050709',
                                                padding: '10px 24px',
                                                borderRadius: '10px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {level === 7 ? 'Victory' : 'Next Level'}
                                            <ArrowRight size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#EF4444' }}>Failed to load quiz.</div>
                )}

                {/* Progress Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '30px' }}>
                    {RANKS.map(r => (
                        <div key={r.level} style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: level >= r.level ? r.color : 'var(--glass-border)',
                            transition: 'all 0.3s'
                        }} title={r.title} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizModal;
