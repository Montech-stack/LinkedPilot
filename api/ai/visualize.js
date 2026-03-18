import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeString, buildVisualizePrompt } from '../_lib/prompts.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { nodeTitle, nodeDetail, childNodes = [], mapTopic, mapMode = 'research' } = req.body ?? {};

    if (!nodeTitle || typeof nodeTitle !== 'string') {
        return res.status(400).json({ error: 'nodeTitle is required.' });
    }

    const safeTitle  = sanitizeString(nodeTitle, 200);
    const safeDetail = sanitizeString(nodeDetail || '', 500);
    const safeTopic  = sanitizeString(mapTopic || nodeTitle, 200);
    const safeMode   = sanitizeString(mapMode, 50);
    const safeChildren = (Array.isArray(childNodes) ? childNodes : []).slice(0, 10).map(n => ({
        title:  sanitizeString(String(n.title  || ''), 100),
        detail: sanitizeString(String(n.detail || ''), 200),
    }));

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.75,
                topP: 0.92,
                maxOutputTokens: 4096,
            },
        });

        const prompt = buildVisualizePrompt(safeTitle, safeDetail, safeChildren, safeTopic, safeMode);
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            return res.status(502).json({ error: 'Invalid AI response format.' });
        }

        if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
            return res.status(502).json({ error: 'Invalid scene data from AI.' });
        }

        return res.status(200).json({ data: parsed });
    } catch (err) {
        console.error('Visualize error:', err);
        return res.status(500).json({ error: 'Visualization generation failed.' });
    }
}
