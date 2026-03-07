import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeString } from '../_lib/prompts.js';

function buildVisualizePrompt(nodeTitle, nodeDetail, childNodes, mapTopic, mapMode) {
    const childSummary = childNodes.length > 0
        ? childNodes.map(n => `- ${n.title}: ${n.detail || ''}`).join('\n')
        : 'No child nodes.';

    return `You are a senior content strategist and creative director making premium animated explainer content. Your job is to create a DEEPLY DETAILED, COMPREHENSIVE explainer — not a surface-level overview. Go deep.

Topic: "${mapTopic}" | Mode: ${mapMode}
Node: "${nodeTitle}"
Detail: "${nodeDetail}"
Related concepts:
${childSummary}

Generate 9-12 scenes that thoroughly explain this concept like a high-quality documentary. Cover history, mechanism, real data, real examples, implications, and takeaways. Every scene must add NEW information — no repetition.

Scene styles:
- "intro": Opening title card — headline + icon + tagline that sets the stage
- "context": The bigger picture — why this matters now, the problem it solves, 3 specific context bullets with real detail
- "timeline": Origin story — 4 real dated milestones showing how this evolved (use specific years and real events)
- "stat": One dramatic real statistic — huge number + 2 sentences explaining significance
- "steps": The mechanism — exactly how it works, 4 numbered steps each 1-2 sentences
- "fact": Deep-dive insights — headline + 4 specific detailed bullet points (not vague — cite specifics)
- "example": A real-world case study — specific company/person/event, what happened, measurable result
- "quote": A real attributed quote from a known expert or practitioner in this specific field
- "outro": Closing — key takeaway + 2 sentences on what to do with this knowledge

Return ONLY valid JSON:
{
  "title": "string (compelling, specific explainer title)",
  "scenes": [
    {
      "style": "intro",
      "duration": 5,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (punchy, max 10 words)",
      "subtext": "string (1-2 sentences setting up what we are about to learn)"
    },
    {
      "style": "context",
      "duration": 6,
      "accent": "#f97316",
      "icon": "emoji",
      "headline": "string (the core problem or opportunity, max 8 words)",
      "body": "string (2-3 sentences on the broader context and why this matters right now)",
      "bullets": ["string (specific context point with real detail)", "string", "string"]
    },
    {
      "style": "timeline",
      "duration": 8,
      "accent": "#f59e0b",
      "icon": "emoji",
      "headline": "string (e.g. How It All Began)",
      "events": [
        { "year": "string", "event": "string (what specifically happened, 1 sentence with real names/facts)" },
        { "year": "string", "event": "string" },
        { "year": "string", "event": "string" },
        { "year": "string", "event": "string" }
      ]
    },
    {
      "style": "stat",
      "duration": 5,
      "accent": "#7c3aed",
      "icon": "emoji",
      "headline": "string (context label, max 6 words)",
      "stat": { "value": number, "unit": "string (e.g. billion, %, ms, x)" },
      "subtext": "string (2 sentences — what this number means and why it changes everything)"
    },
    {
      "style": "steps",
      "duration": 9,
      "accent": "#8b5cf6",
      "icon": "emoji",
      "headline": "string (e.g. How It Works)",
      "steps": [
        "string (step 1 — clear and specific, 1-2 sentences with real technical or process detail)",
        "string (step 2)",
        "string (step 3)",
        "string (step 4)"
      ]
    },
    {
      "style": "fact",
      "duration": 7,
      "accent": "#ec4899",
      "icon": "emoji",
      "headline": "string (max 6 words)",
      "bullets": ["string (specific fact with real data or name)", "string", "string", "string"]
    },
    {
      "style": "example",
      "duration": 6,
      "accent": "#10b981",
      "icon": "emoji",
      "headline": "string (e.g. Case Study: [Real Company or Person])",
      "case": "string (what specifically happened — concrete names, dates, numbers, actions taken)",
      "result": "string (the measurable outcome or impact with specific figures if available)"
    },
    {
      "style": "quote",
      "duration": 5,
      "accent": "#06b6d4",
      "quote": "string (a real, accurate, highly relevant quote from a known expert in this field)",
      "attribution": "string (full name and title or context)"
    },
    {
      "style": "outro",
      "duration": 5,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (key takeaway, max 8 words)",
      "subtext": "string (2 sentences — what to remember and what to do with this knowledge)"
    }
  ]
}

Rules:
- Use REAL, SPECIFIC, VERIFIABLE facts, names, dates, and data — never vague generalities
- stat.value must be a plain number (e.g. 4500000000 not "4.5B")
- Icons must be single emoji characters
- Vary accent colors across scenes
- Cover ALL major aspects: origin, mechanism, real data, real examples, implications
- Write as if this is someone's only chance to truly understand this topic in depth`;
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
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 3072,
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
