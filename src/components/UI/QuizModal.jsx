import React, { useState, useEffect } from 'react';
import { X, Trophy, Check, AlertCircle, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { generateQuiz } from '../../services/api';
import { supabase } from '../../services/supabase';
import NeuroAvatar from './NeuroAvatar';
import Confetti from './Confetti';

const RANKS = [
    { level: 1, title: "Neuro Novice", color: "#60A5FA" },
    { level: 2, title: "Synapse Seeker", color: "#34D399" },
    { level: 3, title: "Dendrite Drifter", color: "#FBBF24" },
    { level: 4, title: "Axon Adventurer", color: "#F472B6" },
    { level: 5, title: "Cortex Commander", color: "#A78BFA" },
    { level: 6, title: "Lobe Legend", color: "#F87171" },
    { level: 7, title: "Neuro Grandmaster", color: "#FCD34D" } // Gold
];

const STORAGE_KEY = 'neuroQuizProgress';

// localStorage helpers (always available as fallback)
const getLocalProgress = (topic) => {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return all[topic] || null;
    } catch { return null; }
};

const saveLocalProgress = (topic, level, streak) => {
    try {
        const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        all[topic] = { level, streak, lastPlayed: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) { console.warn("Quiz save error:", e); }
};

// DB helpers (Supabase when available)
const getDbProgress = async (userId, topic) => {
    if (!supabase || !userId) return null;
    try {
        const { data } = await supabase
            .from('quiz_progress')
            .select('level, streak')
            .eq('user_id', userId)
            .eq('topic', topic)
            .single();
        return data || null;
    } catch { return null; }
};

const saveDbProgress = async (userId, topic, level, streak) => {
    if (!supabase || !userId) return;
    try {
        await supabase.from('quiz_progress').upsert({
            user_id: userId,
            topic,
            level,
            streak,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,topic' });
    } catch (e) { console.warn("DB quiz save error:", e); }
};

const QuizModal = ({ topic, onClose, onFindNode, user, mode }) => {
    // Composite key: different mode = different quiz progress
    const progressKey = `${topic}::${mode || 'research'}`;
    const [level, setLevel] = useState(1);
    const [loading, setLoading] = useState(false);
    const [questionData, setQuestionData] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [result, setResult] = useState(null);
    const [streak, setStreak] = useState(0);
    const [locating, setLocating] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [progressLoaded, setProgressLoaded] = useState(false);

    const loadLevel = async (lvl) => {
        setLoading(true);
        setQuestionData(null);
        setSelectedOption(null);
        setResult(null);
        setShowConfetti(false);
        try {
            const data = await generateQuiz(topic, RANKS[lvl - 1].title);
            setQuestionData(data);
        } catch (error) {
            console.error("Quiz Error:", error);
        }
        setLoading(false);
    };

    const saveProgress = (newLevel, newStreak) => {
        saveLocalProgress(progressKey, newLevel, newStreak);
        saveDbProgress(user?.id, progressKey, newLevel, newStreak);
    };

    // Load saved progress on mount
    useEffect(() => {
        const loadProgress = async () => {
            const dbProgress = await getDbProgress(user?.id, progressKey);
            const localProgress = getLocalProgress(progressKey);
            const saved = dbProgress || localProgress || { level: 1, streak: 0 };

            setLevel(saved.level);
            setStreak(saved.streak);
            setProgressLoaded(true);
            loadLevel(saved.level);
        };
        loadProgress();
    }, [topic, user]);

    const handleOptionClick = (index) => {
        if (result) return;
        setSelectedOption(index);

        if (index === questionData.correctIndex) {
            setResult('correct');
            const newStreak = streak + 1;
            setStreak(newStreak);
            // Save next level so quiz resumes there on reopen
            saveProgress(Math.min(level + 1, 7), newStreak);
            setShowConfetti(true);
        } else {
            setResult('incorrect');
            setStreak(0);
            saveProgress(level, 0);
        }
    };

    const handleNext = () => {
        if (level < 7 && result === 'correct') {
            const newLevel = level + 1;
            setLevel(newLevel);
            saveProgress(newLevel, streak);
            loadLevel(newLevel);
        } else {
            if (result === 'incorrect') {
                loadLevel(level);
            } else {
                onClose();
            }
        }
    };

    const currentRank = RANKS[level - 1];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'var(--glass)',
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
                overflow: 'visible',
                boxShadow: `0 0 40px ${currentRank.color}20`
            }}>
                <Confetti active={showConfetti} />
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
                                        onClick={async () => {
                                            setLocating(true);
                                            // Build concept text from quiz question + correct answer
                                            const correctAnswer = questionData.options[questionData.correctIndex];
                                            const concept = `${correctAnswer} ${questionData.question}`;
                                            await onFindNode(concept);
                                            setLocating(false);
                                        }}
                                        disabled={locating}
                                        style={{
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--accent-cyan)',
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            cursor: locating ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            opacity: locating ? 0.7 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                        title="Find related node on map"
                                    >
                                        {locating ? (
                                            <><Loader2 size={16} className="animate-spin" /> Locating...</>
                                        ) : (
                                            <><MapPin size={16} /> Locate</>
                                        )}
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
