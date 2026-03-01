import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    validateMode,
    sanitizeString,
    buildQuizPrompt,
    parseJSON,
} from '../_lib/prompts.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { topic, levelTitle, modeId = 'research' } = req.body ?? {};

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({ error: 'topic is required.' });
    }
    if (!levelTitle || typeof levelTitle !== 'string') {
        return res.status(400).json({ error: 'levelTitle is required.' });
    }

    const safeTopic      = sanitizeString(topic.trim(), 200);
    const safeLevelTitle = sanitizeString(levelTitle.trim(), 100);
    const safeModeId     = validateMode(modeId);

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
                maxOutputTokens: 1024,
            },
        });

        const prompt = buildQuizPrompt(safeTopic, safeLevelTitle, safeModeId);
        const result = await model.generateContent(prompt);
        const data   = parseJSON(result.response.text());

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('generate-quiz error:', error);
        return res.status(500).json({ error: 'Failed to generate quiz question.' });
    }
}
