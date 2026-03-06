import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeString } from '../_lib/prompts.js';

const VISUALIZATION_TYPES = ['stats', 'timeline', 'comparison', 'flow'];

function buildVisualizePrompt(nodeTitle, nodeDetail, childNodes, mapTopic, mapMode) {
    const childSummary = childNodes.length > 0
        ? childNodes.map(n => `- ${n.title}: ${n.detail || ''}`).join('\n')
        : 'No child nodes yet.';

    return `You are an expert data visualization designer. Given a mind map node, generate a rich, insightful infographic in JSON format.

Mind map topic: "${mapTopic}"
Mode: ${mapMode}
Node title: "${nodeTitle}"
Node detail: "${nodeDetail}"
Child concepts:
${childSummary}

Choose the MOST suitable visualization type from: stats, timeline, comparison, flow.
- stats: for facts, figures, key metrics (use animated counters)
- timeline: for historical events, steps, processes in sequence
- comparison: for pros/cons, feature comparisons, contrasts
- flow: for cause-effect, how something works, process chains

Return ONLY valid JSON in this exact structure depending on type:

For "stats":
{
  "type": "stats",
  "title": "string",
  "subtitle": "string (optional)",
  "items": [
    { "label": "string", "value": number, "unit": "string", "description": "string (1 sentence)", "color": "#hexcode" }
  ]
}
Items: 3-5. Use real, accurate data. Colors: use #00d4ff, #7c3aed, #f97316, #10b981, #f59e0b.

For "timeline":
{
  "type": "timeline",
  "title": "string",
  "items": [
    { "year": "string", "event": "string", "detail": "string (1-2 sentences)", "color": "#hexcode" }
  ]
}
Items: 4-7. Colors alternate between #00d4ff and #7c3aed.

For "comparison":
{
  "type": "comparison",
  "title": "string",
  "sideA": { "label": "string", "color": "#00d4ff", "points": ["string"] },
  "sideB": { "label": "string", "color": "#7c3aed", "points": ["string"] }
}
Points: 3-5 per side.

For "flow":
{
  "type": "flow",
  "title": "string",
  "steps": [
    { "label": "string", "detail": "string (1 sentence)", "color": "#hexcode" }
  ]
}
Steps: 4-6. Colors: cycle through #00d4ff, #7c3aed, #f97316, #10b981.

Be specific, accurate, and insightful. Do not invent false data — use real facts.`;
}

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
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 1024,
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

        if (!VISUALIZATION_TYPES.includes(parsed.type)) {
            return res.status(502).json({ error: 'Unexpected visualization type.' });
        }

        return res.status(200).json({ data: parsed });
    } catch (err) {
        console.error('Visualize error:', err);
        return res.status(500).json({ error: 'Visualization generation failed.' });
    }
}
