import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Check, AlertCircle, ArrowRight, ArrowLeft, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { generateQuiz } from '../../services/api';
import { supabase } from '../../services/supabase';
import NeuroAvatar from './NeuroAvatar';
import Confetti from './Confetti';

const RANKS = [
    { level: 1,  title: "Neuro Novice",      color: "#60A5FA" },
    { level: 2,  title: "Synapse Seeker",     color: "#34D399" },
    { level: 3,  title: "Dendrite Drifter",   color: "#FBBF24" },
    { level: 4,  title: "Axon Adventurer",    color: "#F472B6" },
    { level: 5,  title: "Cortex Commander",   color: "#A78BFA" },
    { level: 6,  title: "Lobe Legend",        color: "#F87171" },
    { level: 7,  title: "Myelin Master",      color: "#6EE7B7" },
    { level: 8,  title: "Glial Guru",         color: "#93C5FD" },
    { level: 9,  title: "Synaptic Sage",      color: "#D8B4FE" },
    { level: 10, title: "Neural Navigator",   color: "#FCA5A5" },
    { level: 11, title: "Cognitive Captain",  color: "#FDE047" },
    { level: 12, title: "Neuro Grandmaster",  color: "#FCD34D" },
];

const PROGRESS_KEY = 'neuroQuizProgress'; // level + streak (synced to DB)
const SESSION_KEY  = 'neuroQuizSession';  // full question + history (local only)

// ── Storage helpers ───────────────────────────────────────────────────────────

const getLocalProgress = (key) => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')[key] || null; }
    catch { return null; }
};
const saveLocalProgress = (key, level, streak) => {
    try {
        const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        all[key] = { level, streak, lastPlayed: Date.now() };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
    } catch {}
};
const getSession = (key) => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')[key] || null; }
    catch { return null; }
};
const persistSession = (key, data) => {
    try {
        const all = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        all[key] = data;
        localStorage.setItem(SESSION_KEY, JSON.stringify(all));
    } catch {}
};

// ── DB helpers ────────────────────────────────────────────────────────────────

const getDbProgress = async (userId, key) => {
    if (!supabase || !userId) return null;
    try {
        const { data } = await supabase
            .from('quiz_progress').select('level, streak')
            .eq('user_id', userId).eq('topic', key).single();
        return data || null;
    } catch { return null; }
};
const saveDbProgress = async (userId, key, level, streak) => {
    if (!supabase || !userId) return;
    try {
        await supabase.from('quiz_progress').upsert(
            { user_id: userId, topic: key, level, streak, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,topic' }
        );
    } catch {}
};

// ── Component ─────────────────────────────────────────────────────────────────

const QuizModal = ({ topic, onClose, onFindNode, user, mode }) => {
    const progressKey = `${topic}::${mode || 'research'}`;

    // Core progress
    const [level,          setLevel]          = useState(1);
    const [streak,         setStreak]         = useState(0);

    // Active question state
    const [loading,        setLoading]        = useState(true);
    const [questionData,   setQuestionData]   = useState(null);
    const [selectedOption, setSelectedOption] = useState(null); // null = unanswered
    const [result,         setResult]         = useState(null); // null | 'correct' | 'incorrect'

    // History & navigation
    // history = [{question,options,correctIndex,explanation,selectedOption,result,level,levelTitle}, ...]
    // ordered oldest[0] → newest[n-1]
    const [history,      setHistory]      = useState([]);
    const [viewingIndex, setViewingIndex] = useState(-1); // -1 = current question, 0+ = history

    // UI
    const [showConfetti, setShowConfetti] = useState(false);
    const [locating,     setLocating]     = useState(false);

    // Guard: don't auto-save until after initial restore is complete
    const ready = useRef(false);

    // ── Auto-save session whenever anything meaningful changes ────────────────
    useEffect(() => {
        if (!ready.current) return;
        persistSession(progressKey, { level, streak, currentQuestion: questionData, selectedOption, result, history });
    }, [progressKey, level, streak, questionData, selectedOption, result, history]);

    // ── Fetch a new question from the API ─────────────────────────────────────
    const fetchQuestion = useCallback(async (lvl) => {
        setLoading(true);
        setQuestionData(null);
        setSelectedOption(null);
        setResult(null);
        setShowConfetti(false);
        setViewingIndex(-1);
        try {
            const data = await generateQuiz(topic, RANKS[lvl - 1].title, mode);
            setQuestionData(data);
        } catch (err) {
            console.error('Quiz fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [topic, mode]);

    // ── Restore session on mount (runs once) ──────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            const [dbProg, localProg] = await Promise.all([
                getDbProgress(user?.id, progressKey),
                Promise.resolve(getLocalProgress(progressKey)),
            ]);
            if (cancelled) return;

            const session = getSession(progressKey);
            const savedLevel  = dbProg?.level  ?? localProg?.level  ?? session?.level  ?? 1;
            const savedStreak = dbProg?.streak ?? localProg?.streak ?? session?.streak ?? 0;

            setLevel(savedLevel);
            setStreak(savedStreak);
            setHistory(session?.history || []);

            if (session?.currentQuestion) {
                // Restore the exact question the user was on — no new API call
                setQuestionData(session.currentQuestion);
                setSelectedOption(session.selectedOption ?? null);
                setResult(session.result ?? null);
                setLoading(false);
            } else {
                await fetchQuestion(savedLevel);
            }

            ready.current = true;
        };
        init();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Answer a question ─────────────────────────────────────────────────────
    const handleOptionClick = (index) => {
        if (result !== null) return; // already answered
        setSelectedOption(index);
        if (index === questionData.correctIndex) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            setResult('correct');
            setShowConfetti(true);
            // ✅ Save CURRENT level (not level+1) — only advance when user clicks Next
            saveLocalProgress(progressKey, level, newStreak);
            saveDbProgress(user?.id, progressKey, level, newStreak);
        } else {
            setResult('incorrect');
            setStreak(0);
            saveLocalProgress(progressKey, level, 0);
            saveDbProgress(user?.id, progressKey, level, 0);
        }
    };

    // ── Advance to next level ─────────────────────────────────────────────────
    const handleNext = async () => {
        const entry = { ...questionData, selectedOption, result, level, levelTitle: RANKS[level - 1].title };
        if (level >= RANKS.length) {
            setHistory(h => [...h, entry]);
            onClose();
            return;
        }
        const newLevel = level + 1;
        setLevel(newLevel);
        setHistory(h => [...h, entry]);
        saveLocalProgress(progressKey, newLevel, streak);
        saveDbProgress(user?.id, progressKey, newLevel, streak);
        await fetchQuestion(newLevel);
    };

    // ── Retry same level ──────────────────────────────────────────────────────
    const handleRetry = async () => {
        const entry = { ...questionData, selectedOption, result, level, levelTitle: RANKS[level - 1].title };
        setHistory(h => [...h, entry]);
        await fetchQuestion(level);
    };

    // ── Locate on map (works for both current and reviewed questions) ─────────
    const handleLocate = async (qData) => {
        setLocating(true);
        const correctAnswer = qData.options[qData.correctIndex];
        await onFindNode(`${correctAnswer} ${qData.question}`, qData);
        setLocating(false);
    };

    // ── History navigation ────────────────────────────────────────────────────
    const goBack = () => {
        if (viewingIndex === -1 && history.length > 0) setViewingIndex(history.length - 1);
        else if (viewingIndex > 0) setViewingIndex(i => i - 1);
    };
    const goForward = () => {
        if (viewingIndex >= 0 && viewingIndex < history.length - 1) setViewingIndex(i => i + 1);
        else if (viewingIndex === history.length - 1) setViewingIndex(-1);
    };

    // ── Derived display values ────────────────────────────────────────────────
    const isReviewing     = viewingIndex >= 0;
    const viewed          = isReviewing ? history[viewingIndex] : null;
    const displayQuestion = isReviewing ? viewed : questionData;
    const displaySelected = isReviewing ? viewed.selectedOption : selectedOption;
    const displayResult   = isReviewing ? viewed.result         : result;
    const displayLevel    = isReviewing ? viewed.level          : level;
    const currentRank     = RANKS[(displayLevel ?? 1) - 1] ?? RANKS[0];

    const totalSeen  = history.length + (questionData ? 1 : 0);
    const currentPos = isReviewing ? viewingIndex + 1 : totalSeen;

    const canGoBack    = viewingIndex === -1 ? history.length > 0 : viewingIndex > 0;
    const canGoForward = isReviewing; // always can go forward when in history (last item returns to current)

    // Avatar state
    const avatarState = loading ? 'thinking'
        : (displayResult === 'correct' ? 'happy' : (displayResult === 'incorrect' ? 'idle' : 'idle'));

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'var(--glass)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '520px',
                background: 'var(--surface)',
                border: `1px solid ${currentRank.color}40`,
                borderRadius: '20px', padding: '28px',
                position: 'relative', overflow: 'visible',
                boxShadow: `0 0 50px ${currentRank.color}18`
            }}>
                <Confetti active={showConfetti} />

                {/* Close */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '14px', right: '14px',
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px'
                }}>
                    <X size={18} />
                </button>

                {/* Review mode banner */}
                {isReviewing && (
                    <div style={{
                        position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)',
                        background: `${currentRank.color}22`, border: `1px solid ${currentRank.color}55`,
                        borderRadius: '20px', padding: '3px 12px',
                        fontSize: '11px', fontFamily: 'var(--font-mono)', color: currentRank.color,
                        letterSpacing: '0.05em', whiteSpace: 'nowrap'
                    }}>
                        Reviewing Q{currentPos} / {totalSeen}
                    </div>
                )}

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px', paddingTop: isReviewing ? '20px' : '0' }}>
                    <div style={{ display: 'inline-block', marginBottom: '10px' }}>
                        <NeuroAvatar state={avatarState} size={56} />
                    </div>

                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800',
                        color: currentRank.color, margin: '0 0 4px', letterSpacing: '-0.5px'
                    }}>
                        Level {displayLevel}: {currentRank.title}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                            {topic}
                        </p>
                        {!isReviewing && streak >= 2 && (
                            <span style={{
                                fontSize: '11px', fontFamily: 'var(--font-mono)',
                                color: '#FBBF24', background: 'rgba(251,191,36,0.12)',
                                border: '1px solid rgba(251,191,36,0.3)',
                                padding: '2px 8px', borderRadius: '20px'
                            }}>
                                🔥 {streak} streak
                            </span>
                        )}
                    </div>
                </div>

                {/* Question area */}
                {loading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
                        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 12px', display: 'block' }} />
                        <p style={{ fontSize: '13px' }}>Crafting your next challenge...</p>
                    </div>
                ) : displayQuestion ? (
                    <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
                        <p style={{
                            fontSize: '15px', lineHeight: '1.65', fontWeight: '500',
                            marginBottom: '20px', textAlign: 'center', color: 'var(--text)'
                        }}>
                            {displayQuestion.question}
                        </p>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {displayQuestion.options.map((opt, i) => {
                                const isCorrect  = i === displayQuestion.correctIndex;
                                const isSelected = i === displaySelected;
                                const answered   = displaySelected !== null;

                                let bg     = 'var(--surface2)';
                                let border = '1px solid var(--glass-border)';
                                let icon   = null;

                                if (answered) {
                                    if (isCorrect) {
                                        bg     = 'rgba(16,185,129,0.12)';
                                        border = '1px solid #10B981';
                                        icon   = <Check size={14} color="#10B981" style={{ flexShrink: 0 }} />;
                                    } else if (isSelected) {
                                        bg     = 'rgba(239,68,68,0.12)';
                                        border = '1px solid #EF4444';
                                        icon   = <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />;
                                    }
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isReviewing && handleOptionClick(i)}
                                        disabled={answered}
                                        style={{
                                            padding: '13px 16px',
                                            background: bg, border,
                                            borderRadius: '12px', color: 'var(--text)',
                                            fontSize: '13px', textAlign: 'left',
                                            cursor: answered ? 'default' : 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: 'var(--font-body)',
                                            display: 'flex', alignItems: 'center', gap: '10px'
                                        }}
                                    >
                                        <span style={{
                                            width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                                            background: answered && isCorrect ? 'rgba(16,185,129,0.2)'
                                                : answered && isSelected ? 'rgba(239,68,68,0.2)'
                                                : 'var(--glass-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)'
                                        }}>
                                            {answered && icon ? icon : String.fromCharCode(65 + i)}
                                        </span>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback */}
                        {displaySelected !== null && (
                            <div style={{ marginTop: '20px', animation: 'fadeInUp 0.3s' }}>
                                {/* Result label */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', marginBottom: '10px',
                                    color: displayResult === 'correct' ? '#10B981' : '#EF4444',
                                    fontWeight: '700', fontSize: '14px'
                                }}>
                                    {displayResult === 'correct'
                                        ? <><Check size={16} /> Correct!</>
                                        : <><AlertCircle size={16} /> Not quite.</>
                                    }
                                </div>

                                {/* Explanation */}
                                {displayQuestion.explanation && (
                                    <p style={{
                                        fontSize: '12px', color: 'var(--text-secondary)',
                                        background: 'var(--surface2)', padding: '12px',
                                        borderRadius: '10px', lineHeight: '1.6', marginBottom: '16px'
                                    }}>
                                        {displayQuestion.explanation}
                                    </p>
                                )}

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {/* Locate on map — works in both current and review mode */}
                                    <button
                                        onClick={() => handleLocate(displayQuestion)}
                                        disabled={locating}
                                        style={{
                                            background: 'var(--surface2)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--accent-cyan)', padding: '9px 16px',
                                            borderRadius: '10px', cursor: locating ? 'wait' : 'pointer',
                                            fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                            opacity: locating ? 0.7 : 1, transition: 'all 0.2s',
                                            fontFamily: 'var(--font-body)'
                                        }}
                                    >
                                        {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                        {locating ? 'Locating...' : 'Locate'}
                                    </button>

                                    {/* Only show action buttons on current question, not in review mode */}
                                    {!isReviewing && (
                                        <>
                                            {displayResult === 'incorrect' && (
                                                <button
                                                    onClick={handleRetry}
                                                    style={{
                                                        background: 'var(--surface2)',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'var(--text)', padding: '9px 16px',
                                                        borderRadius: '10px', cursor: 'pointer',
                                                        fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                        fontFamily: 'var(--font-body)'
                                                    }}
                                                >
                                                    <RotateCcw size={14} /> Try Again
                                                </button>
                                            )}
                                            {displayResult === 'correct' && (
                                                <button
                                                    onClick={handleNext}
                                                    style={{
                                                        background: 'var(--gradient-cyan)', border: 'none',
                                                        color: '#050709', padding: '9px 20px',
                                                        borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
                                                        fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                                                        fontFamily: 'var(--font-display)'
                                                    }}
                                                >
                                                    {level >= RANKS.length ? '🏆 Victory' : 'Next Level'}
                                                    <ArrowRight size={15} />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* In review mode: show "Return to Current" if we have an active question */}
                                    {isReviewing && viewingIndex === history.length - 1 && questionData && (
                                        <button
                                            onClick={() => setViewingIndex(-1)}
                                            style={{
                                                background: `${currentRank.color}18`,
                                                border: `1px solid ${currentRank.color}55`,
                                                color: currentRank.color, padding: '9px 16px',
                                                borderRadius: '10px', cursor: 'pointer',
                                                fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                fontFamily: 'var(--font-body)'
                                            }}
                                        >
                                            Current Question <ArrowRight size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#EF4444', padding: '20px 0', fontSize: '13px' }}>
                        Failed to load question. Please try closing and reopening.
                    </div>
                )}

                {/* ── Bottom nav ───────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '24px'
                }}>
                    {/* Previous button */}
                    <button
                        onClick={goBack}
                        disabled={!canGoBack}
                        style={{
                            background: 'none', border: 'none', padding: '4px 8px',
                            color: canGoBack ? 'var(--text-secondary)' : 'transparent',
                            cursor: canGoBack ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontFamily: 'var(--font-body)',
                            transition: 'color 0.2s'
                        }}
                        title="Review previous question"
                    >
                        <ArrowLeft size={14} /> Previous
                    </button>

                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {RANKS.map(r => {
                            const isCompleted = level > r.level || (level === r.level && result === 'correct');
                            const isCurrent   = level === r.level && !isReviewing;
                            return (
                                <div
                                    key={r.level}
                                    title={r.title}
                                    style={{
                                        width: isCurrent ? '20px' : '7px',
                                        height: '7px', borderRadius: '4px',
                                        background: isCompleted || isCurrent ? r.color : 'var(--glass-border)',
                                        transition: 'all 0.35s ease',
                                        opacity: isCompleted ? 0.7 : 1
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Forward button (only shown when reviewing history) */}
                    <button
                        onClick={goForward}
                        disabled={!canGoForward}
                        style={{
                            background: 'none', border: 'none', padding: '4px 8px',
                            color: canGoForward ? 'var(--text-secondary)' : 'transparent',
                            cursor: canGoForward ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontFamily: 'var(--font-body)',
                            transition: 'color 0.2s'
                        }}
                        title={viewingIndex === history.length - 1 ? 'Back to current question' : 'Next question'}
                    >
                        {viewingIndex === history.length - 1 ? 'Current' : 'Next'}
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizModal;
