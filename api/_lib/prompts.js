/**
 * Backend-only prompt builders.
 * This file NEVER ships to the client — no VITE_ import, no browser code.
 */

const ALLOWED_MODES = new Set([
    'research', 'learning', 'brainstorm', 'study',
    'connect', 'revision', 'career', 'data-integration'
]);

/** Allowlist modeId to prevent prompt injection via forged mode values */
export function validateMode(modeId) {
    return ALLOWED_MODES.has(modeId) ? modeId : 'research';
}

/**
 * Strip null bytes and other dangerous control characters.
 * Does NOT strip quotes / angle brackets — those are needed for prompts
 * but the LLM treats them as data, not markup.
 */
export function sanitizeString(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str
        .slice(0, maxLen)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

// ─── Map generation ───────────────────────────────────────────────────────────

export function buildGenerateMapPrompt(topic, modeId, rawDataContent = null) {
    if (modeId === 'data-integration') return dataIntegrationGeneratePrompt(topic, rawDataContent);

    const builders = {
        research:   researchGeneratePrompt,
        learning:   learningGeneratePrompt,
        brainstorm: brainstormGeneratePrompt,
        study:      studyGeneratePrompt,
        connect:    connectGeneratePrompt,
        revision:   revisionGeneratePrompt,
        career:     careerGeneratePrompt,
    };
    return (builders[modeId] || builders.research)(topic);
}

// ─── Branch expansion ─────────────────────────────────────────────────────────

export function buildExpandPrompt(branchTitle, contextTopic, modeId, rawDataContent = null) {
    if (modeId === 'data-integration') return dataIntegrationExpandPrompt(branchTitle, contextTopic, rawDataContent);

    const builders = {
        research:   researchExpandPrompt,
        learning:   learningExpandPrompt,
        brainstorm: brainstormExpandPrompt,
        study:      studyExpandPrompt,
        connect:    connectExpandPrompt,
        revision:   revisionExpandPrompt,
        career:     careerExpandPrompt,
    };
    return (builders[modeId] || builders.research)(branchTitle, contextTopic);
}

// ─── Ask-node Q&A ─────────────────────────────────────────────────────────────

const MODE_LABELS = {
    research:   'Research',
    learning:   'Learning Path',
    brainstorm: 'Brainstorm',
    study:      'Study Guide',
    connect:    'Connect',
    revision:   'Revision',
    career:     'Career Path',
    'data-integration': 'Data Explorer',
};

const MODE_DESCRIPTIONS = {
    research:   'Explore any topic broadly and discover all its facets',
    learning:   'Structured beginner-to-expert learning journey',
    brainstorm: 'Creative ideation and problem-solving framework',
    study:      'Exam-ready study material with key concepts and practice',
    connect:    'Discover surprising connections between any two topics',
    revision:   'Quick-fire revision cards to test and reinforce your knowledge',
    career:     'Map out career trajectories, skills, and opportunities',
    'data-integration': 'Map out personal documents, Drive folders, or Database schemas',
};

export function buildAskNodePrompt(nodeData, question, contextTopic, modeId, parentChain = []) {
    const label = MODE_LABELS[modeId] || 'Research';
    const description = MODE_DESCRIPTIONS[modeId] || '';

    let chainContext = '';
    if (parentChain.length > 0) {
        const chainStr = parentChain
            .map((n, i) => `${'  '.repeat(i)}${i === 0 ? '🎯' : '→'} ${n.title}`)
            .join('\n');
        chainContext = `\nKnowledge Hierarchy (path to this node):\n${chainStr}\n  → 📍 ${nodeData.title} (current)\n`;
    }

    return `You are Neuro, a brilliant AI tutor with encyclopedic knowledge and the ability to explain anything clearly and engagingly.

CONTEXT:
- Map Topic: "${contextTopic}"
- Current Node: "${nodeData.title}" (${nodeData.category || nodeData.type || 'concept'})
- Node Description: "${nodeData.detail || nodeData.summary || 'No description'}"${chainContext}
- Learning Mode: ${label} — ${description}

USER QUESTION: "${question}"

RESPONSE GUIDELINES:
- Answer in the spirit of ${label} mode — match its tone and depth
- Be comprehensive, specific, and insightful — don't be shallow
- Use concrete real-world examples and analogies that stick
- Structure your answer with clear flow — use numbered lists (1. 2. 3.) or natural paragraphs
- If this node has parent context, connect your answer to the broader hierarchy
- Keep the response engaging and conversational
- Do NOT use markdown asterisks (** or *) — write naturally without formatting symbols
- Do NOT use bullet points with hyphens — use numbered lists or natural prose
- Use plain text only — no markdown, no HTML`;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export function buildQuizPrompt(topic, levelTitle, modeId) {
    const contextMap = {
        career:     'GOAL: Help the user understand the career landscape. Ask about REQUIRED SKILLS, JOB ROLES, SALARY EXPECTATIONS, and INDUSTRY TRENDS.',
        learning:   'GOAL: Take the user from beginner to mastery. Ask about PREREQUISITES, FUNDAMENTAL CONCEPTS, and ADVANCED TOPICS.',
        revision:   'GOAL: Rapid-fire test of recall. Ask about KEY FACTS, DEFINITIONS, and MEMORIZATION items.',
        study:      'GOAL: Prepare the user for an EXAM. Ask about CORE THEORIES, FORMULAS, and COMMON PITFALLS.',
        brainstorm: 'GOAL: Spark creative thinking. Ask about UNCONVENTIONAL SOLUTIONS, "WHAT IF" SCENARIOS, and PROBLEM-SOLVING angles.',
    };
    const contextInstruction = contextMap[modeId]
        || 'GOAL: Deep technical understanding. Ask about DEFINITIONS, MECHANISMS, and NUANCED DETAILS.';

    return `Act as an expert EXAMINER conducting a viva/oral exam on "${topic}".
${contextInstruction}

Generate a SINGLE multiple-choice question to test mastery of: "${topic}".

CRITICAL RULES:
1. Test the USER'S KNOWLEDGE of the subject matter itself
2. Do NOT ask about the "mind map", "nodes", or "structure"
3. Difficulty: "${levelTitle}" (Novice = easy/fundamental, Grandmaster = complex/application-based)
4. Make it thought-provoking and educational

JSON Format: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Clear, educational explanation of why the answer is correct." }
Return ONLY valid JSON.`;
}

// ─── Branch prediction ────────────────────────────────────────────────────────

export function buildPredictBranchPrompt(concept, branchTitles, mapTopic) {
    return `Given a mind map about "${mapTopic}" with these branches:
${branchTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Which ONE branch most likely contains or relates to: "${concept}"?
Return ONLY the exact branch title text, nothing else. No quotes, no explanation.`;
}

// ─── Individual prompt builders ───────────────────────────────────────────────

function researchGeneratePrompt(topic) {
    return `You are an expert researcher creating a comprehensive visual mind map for: "${topic}".

Your goal is to help someone understand ALL dimensions of this topic. Use SIMPLE language, real-world ANALOGIES, and concrete EXAMPLES.

Generate a structured JSON mind map:
{
  "central": { "title": "Short catchy title (2-4 words)", "icon": "single relevant emoji" },
  "branches": [
    {
      "id": "b1", "category": "Foundation",
      "title": "Catchy branch title (2-5 words)",
      "summary": "One-liner hook (max 8 words)",
      "detail": "3-4 sentences. Start with an analogy. Explain the core idea simply. End with why it matters.",
      "icon": "single emoji",
      "children": [{ "id": "b1-1", "title": "Sub-concept", "detail": "2-3 sentences with example." }]
    }
  ]
}

RULES:
1. Create exactly 6 branches: Foundation, Applications, Challenges, Trends, Key Players, Future Outlook
2. Each branch has exactly 3 children
3. IDs: "b1"-"b6", children: "b1-1", "b1-2", etc.
4. Use ANALOGIES — compare to cooking, sports, building, etc.
5. Write for a smart 15-year-old
6. Make summaries punchy (tweet-style)
7. Include "icon" emoji for each branch
8. Return ONLY valid JSON.`;
}

function researchExpandPrompt(branchTitle, contextTopic) {
    return `You are diving deeper into "${branchTitle}" within "${contextTopic}".
Generate ALL important sub-concepts — do NOT limit yourself to a fixed number. Include every concept that matters.
Number each item by importance (1 = most important).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Concept (2-4 words)", "summary": "Hook (max 5 words)", "detail": "2-3 sentences with analogy/example. Explain WHY it matters." }]
Be SPECIFIC and COMPREHENSIVE. Use simple language. Return ONLY JSON.`;
}

function learningGeneratePrompt(topic) {
    return `You are a world-class tutor designing a LEARNING PATH for: "${topic}".

Create a structured journey from absolute beginner to expert. Each level builds on the previous one.

Generate JSON:
{
  "central": { "title": "Learn: ${topic} (short)", "icon": "📚" },
  "branches": [
    {
      "id": "b1", "category": "Prerequisites",
      "title": "What You Need First",
      "summary": "Before you begin... (max 8 words)",
      "detail": "3-4 sentences. What background knowledge is needed? Use an analogy.",
      "icon": "🎯",
      "children": [{ "id": "b1-1", "title": "Specific prerequisite", "detail": "2-3 sentences explaining what to learn first and where." }]
    }
  ]
}

RULES:
1. Exactly 6 branches in this ORDER: Prerequisites, Core Concepts, Intermediate, Advanced, Practice Projects, Mastery Path
2. Each branch has exactly 3 children
3. PROGRESSIVE difficulty — each branch builds on the last
4. Use LOTS of analogies and metaphors
5. Include specific resources, tools, or techniques when relevant
6. Return ONLY valid JSON.`;
}

function learningExpandPrompt(branchTitle, contextTopic) {
    return `You are a tutor expanding on "${branchTitle}" in the learning path for "${contextTopic}".
Generate ALL important lessons and skills — include every concept that a learner needs. No fixed limit.
Number each by learning priority (1 = learn first).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Skill/Lesson (2-4 words)", "summary": "Quick hook (max 5 words)", "detail": "2-3 sentences. What to learn, HOW to practice it, and a real-world analogy." }]
Make it ACTIONABLE. Return ONLY JSON.`;
}

function brainstormGeneratePrompt(topic) {
    return `You are a creative innovation consultant brainstorming on: "${topic}".

Generate creative, unexpected, and actionable ideas. Think like a team of inventors, designers, and entrepreneurs.

Generate JSON:
{
  "central": { "title": "Brainstorm: (catchy 2-3 words)", "icon": "💡" },
  "branches": [
    {
      "id": "b1", "category": "Problem Statement",
      "title": "The Real Challenge",
      "summary": "What's actually broken? (max 8 words)",
      "detail": "3-4 sentences reframing the problem. Use 'What if...?' and 'How might we...?' questions.",
      "icon": "🎯",
      "children": [{ "id": "b1-1", "title": "Sub-problem", "detail": "2-3 sentences breaking down one specific aspect." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Problem Statement, Wild Ideas, Feasible Solutions, Unique Angles, Combinations, Action Steps
2. Each branch has exactly 3 children
3. Be CREATIVE and SPECIFIC — no generic advice
4. Return ONLY valid JSON.`;
}

function brainstormExpandPrompt(branchTitle, contextTopic) {
    return `You are a creative consultant expanding "${branchTitle}" for brainstorming "${contextTopic}".
Generate ALL relevant creative ideas — include every approach worth considering. No fixed limit.
Number each by impact potential (1 = highest impact).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Idea (2-4 words)", "summary": "Spark (max 5 words)", "detail": "2-3 sentences. Be CREATIVE and UNEXPECTED. Use 'What if...' framing." }]
Think WILD. Return ONLY JSON.`;
}

function studyGeneratePrompt(topic) {
    return `You are a top teacher creating an EXAM STUDY GUIDE for: "${topic}".

Make it the kind of cheat sheet students wish they had. Clear, memorable, and exam-ready.

Generate JSON:
{
  "central": { "title": "Study: (short topic)", "icon": "📝" },
  "branches": [
    {
      "id": "b1", "category": "Key Definitions",
      "title": "Must-Know Terms",
      "summary": "Define these or fail (max 8 words)",
      "detail": "3-4 sentences listing the most critical definitions. Use mnemonics or memory tricks.",
      "icon": "📖",
      "children": [{ "id": "b1-1", "title": "Term/Definition", "detail": "Clear definition + memory trick + example." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Key Definitions, Core Theories, Important Formulas, Common Mistakes, Practice Questions, Quick Review
2. Each branch has exactly 3 children
3. Use MNEMONICS, acronyms, and memory aids
4. Return ONLY valid JSON.`;
}

function studyExpandPrompt(branchTitle, contextTopic) {
    return `You are expanding the study guide section "${branchTitle}" for "${contextTopic}".
Generate ALL important study items — include every concept students need to know. No fixed limit.
Number each by exam importance (1 = most likely to appear).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Study item (2-4 words)", "summary": "Key point (max 5 words)", "detail": "2-3 sentences. Include a mnemonic, practice question, or common mistake to avoid." }]
Return ONLY JSON.`;
}

function connectGeneratePrompt(topic) {
    return `You are a polymath finding CONNECTIONS between topics in: "${topic}".

The user may enter two topics separated by "and", "vs", "&", or "+". Find surprising bridges between them. If only one topic, connect it to unexpected fields.

Generate JSON:
{
  "central": { "title": "Connections: (short)", "icon": "🔗" },
  "branches": [
    {
      "id": "b1", "category": "Shared Foundations",
      "title": "Common Ground",
      "summary": "They share THIS (max 8 words)",
      "detail": "3-4 sentences on the surprising shared foundation.",
      "icon": "🤝",
      "children": [{ "id": "b1-1", "title": "Shared concept", "detail": "2-3 sentences on a specific shared principle." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Shared Foundations, Parallel Concepts, Cross Applications, Key Differences, Synthesis Ideas, Combined Future
2. Each branch has exactly 3 children
3. Find SURPRISING, non-obvious connections
4. Be INSIGHTFUL and UNEXPECTED
5. Return ONLY valid JSON.`;
}

function connectExpandPrompt(branchTitle, contextTopic) {
    return `You are exploring connections in "${branchTitle}" between the topics in "${contextTopic}".
Generate ALL meaningful cross-connections — include every surprising link. No fixed limit.
Number each by surprise factor (1 = most unexpected).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Connection (2-4 words)", "summary": "Bridge (max 5 words)", "detail": "2-3 sentences on a surprising link. Use a concrete example." }]
Be SURPRISING. Return ONLY JSON.`;
}

function revisionGeneratePrompt(topic) {
    return `You are an expert tutor creating a REVISION MAP for: "${topic}".

Create the ultimate last-minute revision resource — the kind of sheet students cram from before an exam. Focus on recall, patterns, and common pitfalls.

Generate JSON:
{
  "central": { "title": "Revise: (catchy 2-3 words)", "icon": "🔄" },
  "branches": [
    {
      "id": "b1", "category": "Must-Know Facts",
      "title": "The Essentials",
      "summary": "If you remember NOTHING else (max 8 words)",
      "detail": "3-4 sentences covering the absolute must-know facts. Use bullet-style clarity.",
      "icon": "📌",
      "children": [{ "id": "b1-1", "title": "Critical fact", "detail": "2-3 sentences. State the fact, give context, provide a memory hook." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Must-Know Facts, Key Formulas, Common Mistakes, Quick Definitions, Memory Aids, Exam Tips
2. Each branch has exactly 3 children
3. Be CONCISE, MEMORABLE, and EXAM-FOCUSED
4. Return ONLY valid JSON.`;
}

function revisionExpandPrompt(branchTitle, contextTopic) {
    return `You are expanding the revision section "${branchTitle}" for "${contextTopic}".
Generate ALL important revision items — include everything a student needs to revise. No fixed limit.
Number each by exam frequency (1 = most commonly tested).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Item (2-4 words)", "summary": "Key point (max 5 words)", "detail": "2-3 sentences. Be CONCISE. Include a memory trick or common mistake to avoid." }]
Return ONLY JSON.`;
}

function careerGeneratePrompt(topic) {
    return `You are an elite career advisor mapping the career landscape for: "${topic}".

Create a comprehensive career guide covering how to break in, grow, and thrive in this field.

Generate JSON:
{
  "central": { "title": "Career: (short field name)", "icon": "🚀" },
  "branches": [
    {
      "id": "b1", "category": "Industry Overview",
      "title": "The Landscape",
      "summary": "What this field looks like (max 8 words)",
      "detail": "3-4 sentences painting a picture of the industry. How big is it? Who are the major players?",
      "icon": "🌍",
      "children": [{ "id": "b1-1", "title": "Key sector", "detail": "2-3 sentences about a specific area within this career." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Industry Overview, Required Skills, Entry Points, Growth Ladder, Salary & Demand, Future Trends
2. Each branch has exactly 3 children
3. Be SPECIFIC with real job titles, salary ranges, and tools
4. Return ONLY valid JSON.`;
}

function careerExpandPrompt(branchTitle, contextTopic) {
    return `You are expanding "${branchTitle}" in the career guide for "${contextTopic}".
Generate ALL important career insights — include every actionable piece of advice. No fixed limit.
Number each by career impact (1 = most impactful).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Insight (2-4 words)", "summary": "Key takeaway (max 5 words)", "detail": "2-3 sentences with SPECIFIC advice — mention real tools, job titles, or salary figures when relevant." }]
Be ACTIONABLE and SPECIFIC. Return ONLY JSON.`;
}

function dataIntegrationGeneratePrompt(topic, rawDataContent) {
    return `You are an expert data architect analyzing the following raw user data.
Topic/Source: "${topic}"

RAW DATA CONTENT:
${rawDataContent || 'No data provided.'}

Your goal is to organize this raw text/schema into a structured mind map to help the user understand its architecture or main ideas.

Generate JSON:
{
  "central": { "title": "Data: (short 2-3 words)", "icon": "🗃️" },
  "branches": [
    {
      "id": "b1", "category": "Core Structure",
      "title": "Main Area (e.g. Users Table or Chapter 1)",
      "summary": "Brief observation (max 8 words)",
      "detail": "3-4 sentences summarizing this specific section of the data.",
      "icon": "📊",
      "children": [{ "id": "b1-1", "title": "Specific Column or Sub-concept", "detail": "2-3 sentences explaining this attribute." }]
    }
  ]
}

RULES:
1. Exactly 6 branches representing the main groupings (e.g., schemas, logical document sections).
2. Each branch has exactly 3 children (e.g., specific columns, specific facts).
3. If the data is a Database Schema, group by conceptual tables. If it's a Text Document, group by themes or chapters.
4. Return ONLY valid JSON.`;
}

function dataIntegrationExpandPrompt(branchTitle, contextTopic, rawDataContent) {
    return `You are expanding on "${branchTitle}" from the data source "${contextTopic}".
Use the following RAW DATA to provide deeper insights:

RAW DATA CONTENT:
${rawDataContent || 'No data provided.'}

Generate ALL relevant specific details regarding this branch. No fixed limit.
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Detail (2-4 words)", "summary": "Quick note", "detail": "2-3 sentences explaining this specific column, entity, or document fact." }]
Return ONLY JSON.`;
}

/** Parse JSON from LLM response, stripping markdown fences if present */
export function parseJSON(text) {
    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (match) return JSON.parse(match[0]);
        throw new Error('Invalid JSON from AI response');
    }
}
