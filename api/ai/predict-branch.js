import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    sanitizeString,
    buildPredictBranchPrompt,
} from '../_lib/prompts.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { concept, branchTitles, mapTopic } = req.body ?? {};

    if (!concept || typeof concept !== 'string') {
        return res.status(400).json({ error: 'concept is required.' });
    }
    if (!Array.isArray(branchTitles) || branchTitles.length === 0 || branchTitles.length > 20) {
        return res.status(400).json({ error: 'branchTitles must be an array of 1-20 items.' });
    }
    if (!mapTopic || typeof mapTopic !== 'string') {
        return res.status(400).json({ error: 'mapTopic is required.' });
    }

    const safeConcept  = sanitizeString(concept.trim(), 200);
    const safeTopic    = sanitizeString(mapTopic.trim(), 200);
    const safeBranches = branchTitles
        .slice(0, 20)
        .map(t => sanitizeString(String(t), 100));

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 50,
            },
        });

        const prompt   = buildPredictBranchPrompt(safeConcept, safeBranches, safeTopic);
        const result   = await model.generateContent(prompt);
        const predicted = result.response.text().trim();

        return res.status(200).json({ success: true, branch: predicted });
    } catch (error) {
        console.error('predict-branch error:', error);
        return res.status(500).json({ error: 'Failed to predict branch.' });
    }
}
