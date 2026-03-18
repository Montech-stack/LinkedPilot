import React, { useState, useRef } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Network, Sparkles, Sun, Moon, LogOut, Download, Upload, Pencil, Check, X, Mic, MicOff } from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';
import useVoice from '../../hooks/useVoice';

const MODE_META = {
    research:   { emoji: '🔬', label: 'Research',   color: 'var(--accent-cyan)' },
    learning:   { emoji: '📚', label: 'Learning',   color: 'var(--accent-green)' },
    brainstorm: { emoji: '💡', label: 'Brainstorm', color: 'var(--accent-orange)' },
    study:      { emoji: '📋', label: 'Study',      color: 'var(--accent-purple)' },
    connect:    { emoji: '🔗', label: 'Connect',    color: 'var(--accent-pink)' },
    revision:   { emoji: '🔄', label: 'Revision',   color: 'var(--accent-yellow)' },
    career:     { emoji: '🚀', label: 'Career',     color: 'var(--accent-orange)' },
};

// Export all maps as JSON file
const exportMaps = (savedMaps) => {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        maps: savedMaps && typeof savedMaps === 'object' ? Object.values(savedMaps) : []
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuro-maps-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Import maps from JSON file
const importMaps = (file, savedMaps, onUpdate) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = JSON.parse(e.target.result);
            if (!content.maps || !Array.isArray(content.maps)) {
                alert('Error, please try again.');
                return;
            }
            const currentMaps = savedMaps && typeof savedMaps === 'object' ? Object.assign({}, savedMaps) : {};
            let importedCount = 0;
            content.maps.forEach(map => {
                if (map.id) { currentMaps[map.id] = map; importedCount++; }
            });
            onUpdate(currentMaps);
            alert(`Successfully imported ${importedCount} map${importedCount !== 1 ? 's' : ''}!`);
        } catch {
            alert('Error, please try again.');
        }
    };
    reader.readAsText(file);
};

const Sidebar = ({ savedMaps, currentMapId, onSelectMap, onNewMap, onDeleteMap, onEditMap, theme, onToggleTheme, user, onSignOut, onUpdateMaps, syncEnabled }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [editingMapId, setEditingMapId] = useState(null);
    const [editTopic, setEditTopic] = useState('');
    const [editMode, setEditMode] = useState('');
    const fileInputRef = useRef(null);

    const { isListening, isSTTSupported, startListening, stopListening } = useVoice();

    const mapEntries = savedMaps && typeof savedMaps === 'object' ? Object.values(savedMaps) : [];
    const sortedMaps = mapEntries.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));

    const startEdit = (e, map) => {
        e.stopPropagation();
        setEditingMapId(map.id);
        setEditTopic(map.topic || '');
        setEditMode(map.mode || 'research');
    };

    const cancelEdit = (e) => {
        e?.stopPropagation();
        setEditingMapId(null);
        if (isListening) stopListening();
    };

    const saveEdit = (e) => {
        e?.stopPropagation();
        if (editingMapId && editTopic.trim()) {
            onEditMap(editingMapId, { topic: editTopic.trim(), mode: editMode });
        }
        setEditingMapId(null);
        if (isListening) stopListening();
    };

    const handleMic = (e) => {
        e.stopPropagation();
        if (isListening) {
            stopListening();
        } else {
            startListening((text) => setEditTopic(t => t ? `${t} ${text}` : text));
        }
    };

    return (
        <>
            {/* Click-outside overlay */}
            {!collapsed && (
                <div
                    onClick={() => { setCollapsed(true); cancelEdit(); }}
                    style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'transparent' }}
                />
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    position: 'fixed', top: '20px', left: collapsed ? '16px' : '272px',
                    zIndex: 1100, width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--glass)', backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s var(--ease-smooth)', boxShadow: 'var(--shadow-sm)'
                }}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Sidebar Panel */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '260px', height: '100vh',
                background: 'var(--glass)',
                backdropFilter: `blur(${collapsed ? '0px' : 'var(--glass-blur)'})`,
                WebkitBackdropFilter: `blur(${collapsed ? '0px' : 'var(--glass-blur)'})`,
                borderRight: '1px solid var(--glass-border)', zIndex: 1000,
                padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px',
                transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
                opacity: collapsed ? 0 : 1,
                transition: 'transform 0.3s var(--ease-smooth), opacity 0.25s var(--ease-smooth)',
                pointerEvents: collapsed ? 'none' : 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '4px' }}>
                    <NeuroAvatar state="idle" size={36} />
                    <div>
                        <h1 style={{
                            fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: '800',
                            background: 'linear-gradient(135deg, var(--text), var(--accent-cyan))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2, letterSpacing: '-0.5px'
                        }}>Neuro</h1>
                        <span style={{
                            fontSize: '11px', color: 'var(--muted)',
                            fontFamily: 'var(--font-mono)', letterSpacing: '0.5px'
                        }}>AI Learning Companion</span>
                    </div>
                </div>

                {/* New Map Button */}
                <button
                    onClick={() => { onNewMap(); setCollapsed(true); }}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(124, 58, 237, 0.08))',
                        border: '1px solid rgba(0, 212, 255, 0.25)', borderRadius: '10px',
                        color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600',
                        fontFamily: 'var(--font-display)', fontSize: '13px',
                        transition: 'all 0.25s var(--ease-smooth)', letterSpacing: '0.3px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(124, 58, 237, 0.15))';
                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-glow-cyan)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(124, 58, 237, 0.08))';
                        e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <Sparkles size={15} />
                    New Map
                </button>

                {/* Maps List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <h3 style={{
                        fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)',
                        marginBottom: '12px', letterSpacing: '1.5px', fontFamily: 'var(--font-mono)', fontWeight: '500'
                    }}>Your Maps</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sortedMaps.map(map => (
                            <div key={map.id}>
                                {/* Map row */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: editingMapId === map.id ? '8px 8px 0 0' : '8px',
                                        background: map.id === currentMapId
                                            ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(124, 58, 237, 0.05))'
                                            : 'transparent',
                                        border: map.id === currentMapId
                                            ? '1px solid rgba(0, 212, 255, 0.15)'
                                            : '1px solid transparent',
                                        borderBottom: editingMapId === map.id ? 'none' : undefined,
                                        cursor: editingMapId === map.id ? 'default' : 'pointer',
                                        transition: 'all 0.2s var(--ease-smooth)'
                                    }}
                                    onClick={() => {
                                        if (editingMapId === map.id) return;
                                        onSelectMap(map.id);
                                        setCollapsed(true);
                                    }}
                                    onMouseEnter={(e) => {
                                        if (map.id !== currentMapId && editingMapId !== map.id) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (map.id !== currentMapId && editingMapId !== map.id) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    {/* Title + mode badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                                        <div style={{
                                            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                            background: map.id === currentMapId ? 'var(--accent-cyan)' : 'var(--muted)',
                                            boxShadow: map.id === currentMapId ? '0 0 8px var(--accent-cyan)' : 'none',
                                            transition: 'all 0.2s'
                                        }} />
                                        <div style={{ overflow: 'hidden', flex: 1 }}>
                                            <span style={{
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                fontSize: '13px', fontFamily: 'var(--font-body)',
                                                fontWeight: map.id === currentMapId ? '500' : '400',
                                                color: map.id === currentMapId ? 'var(--text)' : 'var(--text-secondary)',
                                                transition: 'color 0.2s', display: 'block'
                                            }}>
                                                {map.topic || 'Untitled Map'}
                                            </span>
                                            {map.mode && (
                                                <span style={{
                                                    fontSize: '9px', fontFamily: 'var(--font-mono)',
                                                    textTransform: 'uppercase', letterSpacing: '0.8px',
                                                    color: MODE_META[map.mode]?.color || 'var(--muted)',
                                                    marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                }}>
                                                    {MODE_META[map.mode]?.emoji || '📄'} {MODE_META[map.mode]?.label || map.mode}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                        {editingMapId === map.id ? (
                                            // Save / Cancel when editing
                                            <>
                                                <button
                                                    onClick={saveEdit}
                                                    title="Save changes"
                                                    style={{ ...iconBtnStyle, color: 'var(--accent-cyan)' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                                                >
                                                    <Check size={13} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    title="Cancel"
                                                    style={iconBtnStyle}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--muted)'; }}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </>
                                        ) : (
                                            // Edit / Delete
                                            <>
                                                <button
                                                    onClick={(e) => startEdit(e, map)}
                                                    title="Edit map"
                                                    style={iconBtnStyle}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--muted)'; }}
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteMap(map.id); }}
                                                    title="Delete map"
                                                    style={iconBtnStyle}
                                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--muted)'; }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── Inline Edit Form ── */}
                                {editingMapId === map.id && (
                                    <div
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            padding: '12px',
                                            background: 'rgba(0,212,255,0.04)',
                                            border: '1px solid rgba(0,212,255,0.15)',
                                            borderTop: 'none',
                                            borderRadius: '0 0 8px 8px',
                                            display: 'flex', flexDirection: 'column', gap: '10px',
                                        }}
                                    >
                                        {/* Topic input with voice mic */}
                                        <div style={{ position: 'relative' }}>
                                            <label style={{
                                                fontSize: '9px', fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase', letterSpacing: '1px',
                                                color: 'var(--muted)', display: 'block', marginBottom: '5px'
                                            }}>Topic / Prompt</label>
                                            <div style={{ position: 'relative' }}>
                                                {isSTTSupported && (
                                                    <button
                                                        onClick={handleMic}
                                                        title={isListening ? 'Stop recording' : 'Speak topic'}
                                                        style={{
                                                            position: 'absolute', left: '8px', top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            background: 'none', border: 'none',
                                                            color: isListening ? 'var(--accent-cyan)' : 'var(--muted)',
                                                            cursor: 'pointer', padding: '2px',
                                                            display: 'flex', alignItems: 'center',
                                                            animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                                                        }}
                                                    >
                                                        {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                                                    </button>
                                                )}
                                                <input
                                                    type="text"
                                                    value={editTopic}
                                                    onChange={e => setEditTopic(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveEdit(e);
                                                        if (e.key === 'Escape') cancelEdit(e);
                                                    }}
                                                    placeholder={isListening ? '🎙 Listening...' : 'Map topic or prompt...'}
                                                    autoFocus
                                                    style={{
                                                        width: '100%',
                                                        padding: isSTTSupported ? '8px 10px 8px 28px' : '8px 10px',
                                                        background: 'var(--surface)',
                                                        border: `1px solid ${isListening ? 'var(--accent-cyan)' : 'var(--glass-border)'}`,
                                                        borderRadius: '8px',
                                                        color: 'var(--text)',
                                                        fontSize: '12px',
                                                        fontFamily: 'var(--font-body)',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'border-color 0.2s',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Mode selector */}
                                        <div>
                                            <label style={{
                                                fontSize: '9px', fontFamily: 'var(--font-mono)',
                                                textTransform: 'uppercase', letterSpacing: '1px',
                                                color: 'var(--muted)', display: 'block', marginBottom: '6px'
                                            }}>Mode</label>
                                            <div style={{
                                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px'
                                            }}>
                                                {Object.entries(MODE_META).map(([key, meta]) => (
                                                    <button
                                                        key={key}
                                                        onClick={e => { e.stopPropagation(); setEditMode(key); }}
                                                        style={{
                                                            padding: '5px 4px',
                                                            background: editMode === key
                                                                ? `${meta.color}22`
                                                                : 'var(--surface2)',
                                                            border: `1px solid ${editMode === key ? meta.color : 'var(--glass-border)'}`,
                                                            borderRadius: '6px',
                                                            color: editMode === key ? meta.color : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            fontSize: '10px',
                                                            fontFamily: 'var(--font-mono)',
                                                            display: 'flex', flexDirection: 'column',
                                                            alignItems: 'center', gap: '2px',
                                                            transition: 'all 0.15s',
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '13px' }}>{meta.emoji}</span>
                                                        <span style={{ fontSize: '8px', letterSpacing: '0.3px' }}>{meta.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Save button */}
                                        <button
                                            onClick={saveEdit}
                                            disabled={!editTopic.trim()}
                                            style={{
                                                padding: '8px',
                                                background: editTopic.trim()
                                                    ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.1))'
                                                    : 'var(--surface2)',
                                                border: `1px solid ${editTopic.trim() ? 'rgba(0,212,255,0.3)' : 'var(--glass-border)'}`,
                                                borderRadius: '8px',
                                                color: editTopic.trim() ? 'var(--accent-cyan)' : 'var(--muted)',
                                                cursor: editTopic.trim() ? 'pointer' : 'not-allowed',
                                                fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: '700',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <Check size={12} /> Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {sortedMaps.length === 0 && (
                            <div style={{
                                textAlign: 'center', padding: '20px',
                                color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-body)'
                            }}>
                                No maps yet. Create one!
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    paddingTop: '12px', borderTop: '1px solid var(--glass-border)',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                    {/* Theme Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                        </span>
                        <button
                            onClick={onToggleTheme}
                            style={{
                                background: 'var(--surface)', border: '1px solid var(--glass-border)',
                                borderRadius: '8px', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s'
                            }}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    </div>

                    {/* User + Sign Out */}
                    {user && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                            <span style={{
                                fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px'
                            }}>
                                {user.user_metadata?.full_name || user.email}
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {syncEnabled && (
                                    <span style={{
                                        fontSize: '10px', color: 'var(--accent-cyan)',
                                        fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: 'var(--accent-cyan)', boxShadow: '0 0 6px var(--accent-cyan)', display: 'inline-block'
                                        }} />
                                        synced
                                    </span>
                                )}
                                <button
                                    onClick={onSignOut}
                                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color 0.2s' }}
                                    title="Sign Out"
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                                >
                                    <LogOut size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Export / Import */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => exportMaps(savedMaps)}
                            title="Export all maps to JSON file (backup)"
                            style={{ flex: 1, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: '8px', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.15)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,212,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <Download size={12} /> Export
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Import maps from JSON file (backup)"
                            style={{ flex: 1, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', color: 'var(--accent-purple)', cursor: 'pointer', padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-display)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(124,58,237,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <Upload size={12} /> Import
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={e => {
                                if (e.target.files?.[0]) {
                                    importMaps(e.target.files[0], savedMaps, onUpdateMaps);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

// Shared style for icon action buttons in map rows
const iconBtnStyle = {
    background: 'none', border: 'none', color: 'var(--muted)',
    cursor: 'pointer', opacity: 0.4, padding: '4px',
    transition: 'opacity 0.2s, color 0.2s', flexShrink: 0,
    display: 'flex', alignItems: 'center',
};

export default Sidebar;
