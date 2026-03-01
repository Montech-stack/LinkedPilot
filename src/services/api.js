/**
 * Frontend API client.
 *
 * All AI calls proxy through our own serverless functions in /api/ai/*.
 * No API keys, no prompts, no AI SDK imports live here — everything
 * sensitive stays server-side.
 */
import { MOCK_INITIAL_MAP, MOCK_EXPANSION } from './mockData';

// Set VITE_USE_MOCK=true in .env for local dev without a backend key
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// ── Map generation cache (24h TTL, max 30 entries) ──────────────────────────
const CACHE_KEY = 'neuroMapCache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const cacheGet = (key) => {
    try {
        const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const entry = store[key];
        if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    } catch {}
    return null;
};

const cacheSet = (key, data) => {
    try {
        const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        const now = Date.now();
        // Purge expired entries before writing
        for (const k of Object.keys(store)) {
            if (now - store[k].ts >= CACHE_TTL) delete store[k];
        }
        store[key] = { data, ts: now };
        const keys = Object.keys(store);
        if (keys.length > 30) delete store[keys[0]];
        localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    } catch {}
};

// ── Shared fetch helper ──────────────────────────────────────────────────────
async function postJSON(path, body) {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
}

// ── Public API ───────────────────────────────────────────────────────────────

export const generateMap = async (topic, modeId = 'research', rawDataContent = null) => {
    if (useMock) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_INITIAL_MAP), 500));
    }

    const cacheKey = rawDataContent ? null : `map:${modeId}:${topic.toLowerCase().trim()}`;
    if (cacheKey) {
        const cached = cacheGet(cacheKey);
        if (cached) { console.log('Map cache hit:', cacheKey); return cached; }
    }

    const { data } = await postJSON('/api/ai/generate-map', { topic, modeId, rawDataContent });
    if (cacheKey) cacheSet(cacheKey, data);
    return data;
};

export const expandBranch = async (branchTitle, contextTopic, modeId = 'research', rawDataContent = null) => {
    if (useMock) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_EXPANSION), 400));
    }

    const cacheKey = rawDataContent
        ? null
        : `expand:${modeId}:${contextTopic.toLowerCase()}:${branchTitle.toLowerCase()}`;
    if (cacheKey) {
        const cached = cacheGet(cacheKey);
        if (cached) { console.log('Expand cache hit:', cacheKey); return cached; }
    }

    const { data } = await postJSON('/api/ai/expand-branch', { branchTitle, contextTopic, modeId, rawDataContent });
    if (cacheKey) cacheSet(cacheKey, data);
    return data;
};

/**
 * Ask a question about a node with optional streaming support.
 * @param {Object}   node         - The node object
 * @param {string}   question     - User question
 * @param {string}   contextTopic - Map topic
 * @param {string}   modeId       - Mode ID
 * @param {Array}    parentChain  - Array of parent node data objects
 * @param {Function} onChunk      - Streaming callback; receives accumulated text
 */
export const askNodeQuestion = async (
    node,
    question,
    contextTopic,
    modeId = 'research',
    parentChain = [],
    onChunk = null
) => {
    if (useMock) {
        const mockText = 'This is a mock answer. Configure your API key to get real AI responses from Neuro.';
        if (onChunk) {
            for (let i = 10; i <= mockText.length; i += 10) {
                await new Promise(r => setTimeout(r, 80));
                onChunk(mockText.slice(0, i));
            }
            onChunk(mockText);
        }
        return mockText;
    }

    try {
        const response = await fetch('/api/ai/ask-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ node, question, contextTopic, modeId, parentChain }),
        });

        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }

        // Consume the SSE stream
        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';
        let fullText  = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';
            for (const part of parts) {
                if (!part.startsWith('data: ')) continue;
                try {
                    const payload = JSON.parse(part.slice(6));
                    if (payload.error) throw new Error(payload.error);
                    if (payload.chunk) {
                        fullText += payload.chunk;
                        if (onChunk) onChunk(fullText);
                    }
                } catch (parseErr) {
                    console.warn('SSE parse error:', parseErr);
                }
            }
        }
        return fullText;
    } catch (error) {
        console.error('askNodeQuestion error:', error);
        const fallback = "Sorry, I couldn't generate an answer at this moment.";
        if (onChunk) onChunk(fallback);
        return fallback;
    }
};

export const generateQuiz = async (topic, levelTitle, modeId = 'research') => {
    if (useMock) {
        return new Promise(resolve => setTimeout(() => resolve({
            question: `[Mock] What is a key concept related to "${topic}"?`,
            options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
            correctIndex: 1,
            explanation: `Concept B is critical in the context of ${modeId} for ${topic}.`,
        }), 500));
    }

    const { data } = await postJSON('/api/ai/generate-quiz', { topic, levelTitle, modeId });
    return data;
};

export const predictBranch = async (concept, branchTitles, mapTopic) => {
    if (useMock || !branchTitles?.length) return branchTitles?.[0] || null;

    try {
        const { branch } = await postJSON('/api/ai/predict-branch', { concept, branchTitles, mapTopic });
        return branch;
    } catch (error) {
        console.error('Branch prediction failed:', error);
        return branchTitles[0] || null;
    }
};
