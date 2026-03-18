import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    validateMode,
    sanitizeString,
    buildAskNodePrompt,
} from '../_lib/prompts.js';

// Increase Vercel function timeout for streaming responses
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { node, question, contextTopic, modeId = 'research', parentChain = [] } = req.body ?? {};

    // ── Input validation ────────────────────────────────────────────────────
    if (!node || typeof node !== 'object') {
        return res.status(400).json({ error: 'node is required.' });
    }
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'question is required.' });
    }
    if (!contextTopic || typeof contextTopic !== 'string') {
        return res.status(400).json({ error: 'contextTopic is required.' });
    }
    if (!Array.isArray(parentChain) || parentChain.length > 10) {
        return res.status(400).json({ error: 'parentChain must be an array of at most 10 items.' });
    }

    // Extract only the fields we need from node — never trust the full object
    const nodeData = {
        title:    sanitizeString(node.data?.title    ?? node.title    ?? '', 200),
        detail:   sanitizeString(node.data?.detail   ?? node.detail   ?? '', 500),
        summary:  sanitizeString(node.data?.summary  ?? node.summary  ?? '', 200),
        category: sanitizeString(node.data?.category ?? node.type     ?? '', 100),
        type:     sanitizeString(node.type           ?? '',  50),
    };

    const safeQuestion    = sanitizeString(question.trim(), 1000);
    const safeTopic       = sanitizeString(contextTopic.trim(), 200);
    const safeModeId      = validateMode(modeId);
    const safeParentChain = parentChain
        .slice(0, 10)
        .map(n => ({ title: sanitizeString(n?.title ?? '', 100) }));

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured.' });
    }

    // ── Streaming SSE response ───────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.92,
                maxOutputTokens: 4096,
            },
        });

        const prompt = buildAskNodePrompt(nodeData, safeQuestion, safeTopic, safeModeId, safeParentChain);
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
        console.error('ask-node error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Failed to generate answer.' })}\n\n`);
    } finally {
        res.end();
    }
}
