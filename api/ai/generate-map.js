import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    validateMode,
    sanitizeString,
    buildGenerateMapPrompt,
    parseJSON,
} from '../_lib/prompts.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic, modeId = 'research', rawDataContent = null } = req.body ?? {};

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({ error: 'topic is required.' });
    }

    const safeTopic      = sanitizeString(topic.trim(), 200);
    const safeModeId     = validateMode(modeId);
    const safeRawData    = rawDataContent ? sanitizeString(rawDataContent, 50000) : null;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.8,
                topP: 0.92,
                maxOutputTokens: 4096,
            },
        });

        const prompt = buildGenerateMapPrompt(safeTopic, safeModeId, safeRawData);
        const result = await model.generateContent(prompt);
        const data   = parseJSON(result.response.text());

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('generate-map error:', error);
        return res.status(500).json({ error: 'Failed to generate map.' });
    }
}
