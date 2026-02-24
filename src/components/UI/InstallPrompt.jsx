import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import NeuroAvatar from './NeuroAvatar';

// Device-specific detection for iOS
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Generate device ID (tied to device, not account)
const getDeviceId = () => {
    let deviceId = localStorage.getItem('neuro_device_id');
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('neuro_device_id', deviceId);
    }
    return deviceId;
};

const DISMISSED_KEY = (deviceId) => `neuro_pwa_dismissed_${deviceId}`;

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const deviceId = getDeviceId();

    useEffect(() => {
        const dismissedKey = DISMISSED_KEY(deviceId);
        
        // Don't show if user already dismissed on THIS device
        if (localStorage.getItem(dismissedKey)) return;

        // Don't show if already installed (running in standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // iOS Safari detection
        if (isIOS()) {
            setShowIOSPrompt(true);
            return;
        }

        // Android/Desktop: use beforeinstallprompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [deviceId]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
        // Only permanently dismiss if user rejected — accepted means it's installed
        if (outcome === 'dismissed') {
            localStorage.setItem(DISMISSED_KEY(deviceId), '1');
        }
    };

    const handleDismiss = () => {
        if (showIOSPrompt) setShowIOSPrompt(false);
        else setVisible(false);
        localStorage.setItem(DISMISSED_KEY(deviceId), '1');
    };

    if (!visible && !showIOSPrompt) return null;

    const content = showIOSPrompt ? {
        title: 'Install Neuro',
        description: 'Tap the Share icon and select "Add to Home Screen"'
    } : {
        title: 'Install Neuro',
        description: 'Add to your home screen for a native app experience'
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'var(--glass)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            border: '1px solid var(--glass-border)',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,212,255,0.08)',
            maxWidth: '360px',
            width: 'calc(100vw - 32px)',
            animation: 'fadeInUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
            <NeuroAvatar state="idle" size={38} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text)',
                    marginBottom: '3px',
                }}>
                    {content.title}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                }}>
                    {content.description}
                </div>
            </div>

            {!showIOSPrompt && (
                <button
                    onClick={handleInstall}
                    style={{
                        background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        padding: '9px 14px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.2px',
                    }}
                >
                    <Download size={12} />
                    Install
                </button>
            )}

            <button
                onClick={handleDismiss}
                title="Dismiss"
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    borderRadius: '6px',
                    transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default InstallPrompt;
