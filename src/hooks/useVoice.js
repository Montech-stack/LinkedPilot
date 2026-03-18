import { useState, useRef, useCallback, useEffect } from 'react';

// Strip markdown to produce clean speech output
const stripMarkdown = (text) => {
    return text
        .replace(/#{1,3}\s+/g, '')
        .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/^[-•]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .trim();
};

const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    const isSTTSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // ── Voice Input (Speech-to-Text) ─────────────────────────────────────
    const startListening = useCallback((onResult) => {
        if (!isSTTSupported) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (transcript) onResult(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [isSTTSupported]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // ── Voice Output (Text-to-Speech) ────────────────────────────────────
    const speak = useCallback((text, onEnd) => {
        if (!isTTSSupported || !synth) return;
        synth.cancel();

        const cleanText = stripMarkdown(text);
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        // Prefer a natural-sounding voice if available
        const voices = synth.getVoices();
        const preferred = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
        ) || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            onEnd?.();
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            onEnd?.();
        };

        synth.speak(utterance);
    }, [isTTSSupported, synth]);

    const stopSpeaking = useCallback(() => {
        synth?.cancel();
        setIsSpeaking(false);
    }, [synth]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort();
            synth?.cancel();
        };
    }, [synth]);

    return {
        isListening,
        isSpeaking,
        isSTTSupported,
        isTTSSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
    };
};

export default useVoice;
