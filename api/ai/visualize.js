import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeString } from '../_lib/prompts.js';

const SCENE_STYLES = ['intro', 'stat', 'fact', 'quote', 'outro'];

function buildVisualizePrompt(nodeTitle, nodeDetail, childNodes, mapTopic, mapMode) {
    const childSummary = childNodes.length > 0
        ? childNodes.map(n => `- ${n.title}: ${n.detail || ''}`).join('\n')
        : 'No child nodes.';

    return `You are a creative director for animated explainer videos. Given a mind map node, generate a short animated explainer script as JSON.

Topic: "${mapTopic}" | Mode: ${mapMode}
Node: "${nodeTitle}"
Detail: "${nodeDetail}"
Related concepts:
${childSummary}

Generate 5-7 scenes that tell the story of this concept like an animated explainer video.
Each scene plays for a few seconds with animated text and visuals.

Scene styles available:
- "intro": Opening title card — big headline + icon + tagline
- "stat": A single dramatic statistic with context — huge number + unit + supporting text
- "fact": A key insight with 2-3 bullet points that animate in
- "quote": A powerful quote or key principle, attributed
- "outro": Closing takeaway — what to remember

Return ONLY valid JSON:
{
  "title": "string (overall explainer title)",
  "scenes": [
    {
      "style": "intro",
      "duration": 4,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (short, punchy, max 8 words)",
      "subtext": "string (1 sentence, max 15 words)"
    },
    {
      "style": "stat",
      "duration": 4,
      "accent": "#7c3aed",
      "icon": "emoji",
      "headline": "string (context label, max 6 words)",
      "stat": { "value": number, "unit": "string (e.g. billion, %, ms, x)" },
      "subtext": "string (why this number matters, max 15 words)"
    },
    {
      "style": "fact",
      "duration": 5,
      "accent": "#f97316",
      "icon": "emoji",
      "headline": "string (max 6 words)",
      "bullets": ["string (max 10 words)", "string", "string"]
    },
    {
      "style": "quote",
      "duration": 4,
      "accent": "#10b981",
      "quote": "string (a real, famous, or highly relevant quote or key principle, max 20 words)",
      "attribution": "string (source/author)"
    },
    {
      "style": "outro",
      "duration": 4,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (takeaway, max 8 words)",
      "subtext": "string (one memorable closing thought, max 15 words)"
    }
  ]
}

Rules:
- Use real, accurate facts and data
- Make it feel like a premium animated video — punchy, visual, dramatic
- Vary the accent colors across scenes
- Icons must be single emoji characters
- stat.value must be a plain number (e.g. 1760000 not "1.76T")`;
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

        if (!Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
            return res.status(502).json({ error: 'Invalid scene data from AI.' });
        }

        return res.status(200).json({ data: parsed });
    } catch (err) {
        console.error('Visualize error:', err);
        return res.status(500).json({ error: 'Visualization generation failed.' });
    }
}
