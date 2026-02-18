import React, { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Network, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AuthModal = ({ mode = 'login', onSwitchMode, onClose, onSuccess }) => {
    const { signIn, signUp, signInWithGoogle, error, clearError, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const isLogin = mode === 'login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setMessage('');

        if (!isLogin && password !== confirmPassword) {
            setMessage('');
            return;
        }

        if (isLogin) {
            const result = await signIn(email, password);
            if (!result.error) {
                onSuccess?.();
            }
        } else {
            const result = await signUp(email, password, fullName);
            if (!result.error) {
                setMessage('Check your email to confirm your account!');
            }
        }
    };

    const eyeButtonStyle = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: 'var(--muted)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        transition: 'color 0.2s'
    };

    const passwordMismatch = !isLogin && confirmPassword && password !== confirmPassword;

    const inputStyle = {
        width: '100%',
        padding: '12px 40px 12px 42px',
        background: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '10px',
        color: 'var(--text)',
        fontSize: '14px',
        fontFamily: 'var(--font-body)',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    };

    const iconStyle = {
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--muted)',
        pointerEvents: 'none'
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                background: 'rgba(5, 7, 9, 0.8)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeInUp 0.3s ease-out'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'var(--surface-solid)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '36px',
                width: '400px',
                maxWidth: '92vw',
                position: 'relative',
                boxShadow: 'var(--shadow-lg)',
                animation: 'fadeInUp 0.4s var(--ease-spring)'
            }}>
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--gradient-cyan)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: 'var(--shadow-glow-cyan)'
                    }}>
                        <Network size={24} color="#050709" strokeWidth={2.5} />
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '22px',
                        fontWeight: '800',
                        marginBottom: '6px'
                    }}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)'
                    }}>
                        {isLogin ? 'Sign in to continue mapping' : 'Start mapping your ideas for free'}
                    </p>
                </div>

                {/* Google Auth */}
                <button
                    onClick={signInWithGoogle}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.2s',
                        marginBottom: '20px'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '20px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {!isLogin && (
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={iconStyle} />
                            <input
                                type="text"
                                placeholder="Full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={inputStyle}
                                required
                            />
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail size={16} style={iconStyle} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={iconStyle} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={eyeButtonStyle}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {!isLogin && (
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={iconStyle} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    ...inputStyle,
                                    borderColor: passwordMismatch ? 'rgba(239, 68, 68, 0.5)' : undefined
                                }}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={eyeButtonStyle}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            {passwordMismatch && (
                                <span style={{
                                    fontSize: '11px',
                                    color: '#ef4444',
                                    marginTop: '4px',
                                    display: 'block'
                                }}>Passwords do not match</span>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '12px'
                        }}>{error}</div>
                    )}

                    {/* Success Message */}
                    {message && (
                        <div style={{
                            padding: '10px 14px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            color: 'var(--accent-green)',
                            fontSize: '12px'
                        }}>{message}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '13px',
                            background: 'var(--gradient-cyan)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#050709',
                            cursor: loading ? 'wait' : 'pointer',
                            fontFamily: 'var(--font-display)',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            boxShadow: 'var(--shadow-glow-cyan)',
                            marginTop: '4px'
                        }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                {/* Switch Mode */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => { clearError(); setMessage(''); onSwitchMode(isLogin ? 'signup' : 'login'); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            fontFamily: 'var(--font-body)',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
