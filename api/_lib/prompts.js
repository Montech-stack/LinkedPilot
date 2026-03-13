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

const MODE_TONE = {
    research:   'precise and analytical — cite specific mechanisms, name real entities, give measurable data points',
    learning:   'structured and pedagogical — break the answer into clear steps, state what to learn first and exactly why',
    brainstorm: 'creative and provocative — challenge assumptions, offer unconventional angles, propose testable experiments',
    study:      'exam-focused and memorable — lead with the core fact, add a mnemonic or pattern, flag common mistakes',
    connect:    'surprising and cross-disciplinary — name the unexpected bridge, explain the underlying shared principle',
    revision:   'rapid-fire and precise — one sentence per key fact, zero padding, maximum signal',
    career:     'tactical and specific — name real job titles, real salary ranges, real tools/certifications employers look for',
    'data-integration': 'systematic and technical — describe structures, relationships, data types, and constraints explicitly',
};

export function buildAskNodePrompt(nodeData, question, contextTopic, modeId, parentChain = []) {
    const label = MODE_LABELS[modeId] || 'Research';
    const tone = MODE_TONE[modeId] || MODE_TONE.research;

    let chainContext = '';
    if (parentChain.length > 0) {
        const chainStr = parentChain
            .map((n, i) => `${'  '.repeat(i)}${i === 0 ? '🎯' : '→'} ${n.title}`)
            .join('\n');
        chainContext = `\nKnowledge Hierarchy (path to this node):\n${chainStr}\n  → 📍 ${nodeData.title} (current)\n`;
    }

    return `You are Neuro, a world-class expert tutor. Your answers are direct, dense with value, and respected by people who demand real knowledge — not filler.

CONTEXT:
- Map Topic: "${contextTopic}"
- Current Node: "${nodeData.title}" (${nodeData.category || nodeData.type || 'concept'})
- Node Description: "${nodeData.detail || nodeData.summary || 'No description'}"${chainContext}
- Mode: ${label} — tone required: ${tone}

USER QUESTION: "${question}"

HOW TO ANSWER:
1. Open with the direct answer or the single most important fact — no preamble, no "great question", no "certainly"
2. Immediately follow with the mechanism, cause, or proof — WHY is this true?
3. Give a concrete, specific real-world example (name an actual company, person, event, or number — not a hypothetical)
4. If the topic has common misconceptions or traps, name them explicitly
5. If the hierarchy context is provided, tie your answer back to the parent concept to show how it fits the bigger picture
6. Close with one actionable insight, a key takeaway, or the next logical question to explore

HARD RULES:
- No "Of course!", "Great question!", "Certainly!", "Sure!", or any opener that wastes the user's time
- No vague generalities — every claim needs a specific detail, number, name, or example
- No markdown asterisks (** or *), no hyphens as bullets, no HTML
- Use numbered lists (1. 2. 3.) or natural paragraphs only
- Minimum 150 words, no arbitrary maximum — answer as fully as the question deserves
- If the question is simple, still give depth: the why, the implication, and a real example`;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export function buildQuizPrompt(topic, levelTitle, modeId) {
    const contextMap = {
        career:     'Focus on REAL INDUSTRY KNOWLEDGE: specific job titles, salary bands, required certifications, tools employers demand, and career progression realities.',
        learning:   'Focus on CONCEPTUAL MASTERY: prerequisites, core principles, common beginner mistakes, and the jump from understanding to application.',
        revision:   'Focus on PRECISE RECALL: exact definitions, specific formulas or steps, critical distinctions between similar terms.',
        study:      'Focus on EXAM PITFALLS: commonly confused concepts, edge cases, formulas with tricky conditions, and application of theory to scenarios.',
        brainstorm: 'Focus on CREATIVE PROBLEM-SOLVING: unconventional approaches, lateral thinking, identifying the real constraint in a problem.',
    };
    const contextInstruction = contextMap[modeId]
        || 'Focus on DEEP TECHNICAL UNDERSTANDING: precise definitions, underlying mechanisms, nuanced distinctions, and real-world implications.';

    return `You are a rigorous examiner testing genuine mastery of "${topic}".
${contextInstruction}

Difficulty level: "${levelTitle}" — Novice = foundational facts; Grandmaster = application, edge cases, and synthesis.

Generate ONE multiple-choice question that:
- Tests actual subject knowledge (NEVER asks about mind maps, nodes, or app features)
- Has one unambiguously correct answer
- Has three wrong answers that are plausible — not obviously silly distractors
- Teaches something valuable through the explanation, even when the user gets it right

The explanation MUST: state WHY the correct answer is right, WHY the wrong answers are wrong, and add one piece of insight the question itself didn't reveal.

JSON Format: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }
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
    return `You are a senior research analyst building a comprehensive visual mind map on: "${topic}".

Every node must contain specific, factual, expert-level content. No vague summaries — name real entities, real mechanisms, real data.

Generate a structured JSON mind map:
{
  "central": { "title": "Short precise title (2-4 words)", "icon": "single relevant emoji" },
  "branches": [
    {
      "id": "b1", "category": "Foundation",
      "title": "Precise branch title (2-5 words)",
      "summary": "One concrete takeaway (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: state the core fact or mechanism. Sentence 2: give a specific real-world example with a name or number. Sentence 3: explain why this matters or what it enables. Sentence 4 (optional): name a counterintuitive aspect or common misunderstanding.",
      "icon": "single emoji",
      "children": [{ "id": "b1-1", "title": "Sub-concept (2-4 words)", "detail": "2-3 sentences: define precisely, give one specific example, state the implication." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Foundation, Applications, Challenges, Trends, Key Players, Future Outlook
2. Each branch has exactly 3 children
3. IDs: "b1"-"b6", children: "b1-1", "b1-2", etc.
4. Use real names, real numbers, real companies or events — not "for example, imagine..."
5. Every detail field must contain at least one specific fact (date, percentage, name, measurement)
6. Summaries must be punchy and factual, not motivational filler
7. Return ONLY valid JSON.`;
}

function researchExpandPrompt(branchTitle, contextTopic) {
    return `You are a research expert going deep into "${branchTitle}" within the broader topic of "${contextTopic}".

Generate ALL important sub-concepts — include every concept that genuinely matters. No fixed limit.
Number each by importance (1 = most important).

For each item: the title names the concept precisely, the summary is a single punchy factual hook, and the detail gives 2-3 sentences that: (1) define or describe the mechanism precisely, (2) cite a real example with a name or number, (3) explain why it matters in the context of "${contextTopic}".

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Concept (2-4 words)", "summary": "Factual hook (max 5 words)", "detail": "2-3 sentences. Specific. No vague generalities." }]
Return ONLY JSON.`;
}

function learningGeneratePrompt(topic) {
    return `You are a world-class instructor designing a rigorous LEARNING PATH for: "${topic}".

Each node must tell the learner exactly what to learn, in what order, and why — not just that something exists.

Generate JSON:
{
  "central": { "title": "Learn: ${topic} (short)", "icon": "📚" },
  "branches": [
    {
      "id": "b1", "category": "Prerequisites",
      "title": "What You Need First",
      "summary": "Start here or struggle later (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: name the specific prerequisite skills or knowledge. Sentence 2: explain exactly why each is needed (not just 'it helps'). Sentence 3: name a concrete resource or method to acquire it. Sentence 4: state what breaks without it.",
      "icon": "🎯",
      "children": [{ "id": "b1-1", "title": "Specific prerequisite (2-4 words)", "detail": "2-3 sentences: what exactly to learn, how to know you've learned it, where to learn it (specific resource, tool, or practice method)." }]
    }
  ]
}

RULES:
1. Exactly 6 branches in ORDER: Prerequisites, Core Concepts, Intermediate, Advanced, Practice Projects, Mastery Path
2. Each branch has exactly 3 children
3. PROGRESSIVE difficulty — each branch must explicitly reference what it builds on from the previous
4. Name real tools, frameworks, courses, or authors when relevant
5. Every child detail must be actionable: "do X to achieve Y" not "learn about X"
6. Return ONLY valid JSON.`;
}

function learningExpandPrompt(branchTitle, contextTopic) {
    return `You are an expert instructor expanding "${branchTitle}" in the learning path for "${contextTopic}".

Generate ALL important lessons and skills — every concept a learner genuinely needs. No fixed limit.
Number each by learning priority (1 = learn first).

Each item must be actionable: state what to do, how to practice it, and how to know it's mastered. Name real tools, resources, or techniques.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Skill/Lesson (2-4 words)", "summary": "What you gain (max 5 words)", "detail": "2-3 sentences. Actionable. Name specific tools or resources. State the measurable outcome of mastering this." }]
Return ONLY JSON.`;
}

function brainstormGeneratePrompt(topic) {
    return `You are a seasoned innovation strategist brainstorming on: "${topic}".

Every idea must be specific and actionable — not vague inspiration. Name real constraints, real technologies, real markets, or real failure modes.

Generate JSON:
{
  "central": { "title": "Brainstorm: (catchy 2-3 words)", "icon": "💡" },
  "branches": [
    {
      "id": "b1", "category": "Problem Statement",
      "title": "The Real Challenge",
      "summary": "The actual bottleneck (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: state the problem precisely with a specific constraint or failure point. Sentence 2: explain who is most affected and what they currently do instead. Sentence 3: name a past attempt to solve this and why it fell short. Sentence 4: reframe as a 'How might we...' challenge.",
      "icon": "🎯",
      "children": [{ "id": "b1-1", "title": "Sub-problem (2-4 words)", "detail": "2-3 sentences: what specifically breaks, for whom, and what a solution would need to address." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Problem Statement, Wild Ideas, Feasible Solutions, Unique Angles, Combinations, Action Steps
2. Each branch has exactly 3 children
3. Wild Ideas must be genuinely unconventional — not incremental improvements
4. Feasible Solutions must name real technologies, business models, or proven approaches
5. Action Steps must be concrete next actions (verbs + specific deliverables)
6. Return ONLY valid JSON.`;
}

function brainstormExpandPrompt(branchTitle, contextTopic) {
    return `You are an innovation strategist expanding "${branchTitle}" for the brainstorm on "${contextTopic}".

Generate ALL relevant ideas — every approach worth considering. No fixed limit.
Number each by impact potential (1 = highest impact).

Wild ideas should name specific technologies or mechanisms. Feasible ideas should reference real-world precedents. Every idea needs a concrete "this means doing X" statement.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Idea (2-4 words)", "summary": "Core mechanism (max 5 words)", "detail": "2-3 sentences. Be specific: name the technology, the precedent, or the mechanism. State what makes this better than the obvious approach." }]
Return ONLY JSON.`;
}

function studyGeneratePrompt(topic) {
    return `You are an expert teacher and examiner creating a high-yield EXAM STUDY GUIDE for: "${topic}".

Every node must maximize exam performance: precise definitions, exact formulas, real traps students fall into, and high-retention memory aids.

Generate JSON:
{
  "central": { "title": "Study: (short topic)", "icon": "📝" },
  "branches": [
    {
      "id": "b1", "category": "Key Definitions",
      "title": "Must-Know Terms",
      "summary": "Define these or fail (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: list the 3-4 most exam-critical terms. Sentence 2: give the precise definition of the most important one. Sentence 3: explain the most common way students misdefine it. Sentence 4: provide a mnemonic or pattern to lock it in.",
      "icon": "📖",
      "children": [{ "id": "b1-1", "title": "Term (2-4 words)", "detail": "Precise definition. One concrete example. One mnemonic or memory trick. One mistake to avoid." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Key Definitions, Core Theories, Important Formulas, Common Mistakes, Practice Questions, Quick Review
2. Each branch has exactly 3 children
3. Every definition must be exam-precise — not paraphrased loosely
4. Common Mistakes must describe the specific error AND why students make it
5. Practice Questions must include the answer and explain the reasoning
6. Return ONLY valid JSON.`;
}

function studyExpandPrompt(branchTitle, contextTopic) {
    return `You are expanding the study guide section "${branchTitle}" for the topic "${contextTopic}".

Generate ALL important study items — every concept a student needs to know for exams. No fixed limit.
Number each by exam likelihood (1 = most commonly tested).

Each item must be exam-ready: precise, memorable, and include at least one of: a mnemonic, a common mistake, a worked example, or a formula.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Study item (2-4 words)", "summary": "Core fact (max 5 words)", "detail": "2-3 sentences. Exam-precise. Include mnemonic, common mistake, or worked example." }]
Return ONLY JSON.`;
}

function connectGeneratePrompt(topic) {
    return `You are a cross-disciplinary scholar finding deep CONNECTIONS in: "${topic}".

The user may have entered two topics separated by "and", "vs", "&", or "+". Find the non-obvious bridges — the kind that make experts say "I never thought of that." If one topic, connect it to surprising adjacent fields.

Generate JSON:
{
  "central": { "title": "Connections: (short)", "icon": "🔗" },
  "branches": [
    {
      "id": "b1", "category": "Shared Foundations",
      "title": "Common Ground",
      "summary": "The surprising shared root (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: name the shared underlying principle precisely. Sentence 2: show how each topic independently arrived at or uses this principle. Sentence 3: name a real person or moment where this connection was discovered or exploited. Sentence 4: state what would break in both fields if this shared foundation were removed.",
      "icon": "🤝",
      "children": [{ "id": "b1-1", "title": "Shared concept (2-4 words)", "detail": "2-3 sentences: name the specific shared mechanism, give a concrete example from each field, explain why this connection is underappreciated." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Shared Foundations, Parallel Concepts, Cross Applications, Key Differences, Synthesis Ideas, Combined Future
2. Each branch has exactly 3 children
3. Every connection must name a real example, event, or person — not a generic analogy
4. Key Differences must be precise and technically meaningful — not surface-level
5. Synthesis Ideas must propose something genuinely novel, not an obvious mashup
6. Return ONLY valid JSON.`;
}

function connectExpandPrompt(branchTitle, contextTopic) {
    return `You are exploring cross-disciplinary connections in "${branchTitle}" between the topics in "${contextTopic}".

Generate ALL meaningful connections — every surprising link worth surfacing. No fixed limit.
Number each by surprise and insight value (1 = most unexpected and useful).

Every connection must name real people, events, experiments, or companies — not hypothetical analogies.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Connection (2-4 words)", "summary": "The bridge (max 5 words)", "detail": "2-3 sentences: name the specific shared mechanism or principle, give a real example from each domain, explain the practical implication of recognizing this link." }]
Return ONLY JSON.`;
}

function revisionGeneratePrompt(topic) {
    return `You are a senior examiner creating a high-density REVISION MAP for: "${topic}".

This is for students in the final hours before an exam. Every word must earn its place. Zero padding, maximum signal.

Generate JSON:
{
  "central": { "title": "Revise: (catchy 2-3 words)", "icon": "🔄" },
  "branches": [
    {
      "id": "b1", "category": "Must-Know Facts",
      "title": "The Non-Negotiables",
      "summary": "Forget these, lose marks (max 8 words)",
      "detail": "3-4 sentences. List the 3-4 facts that examiners test most. For each: state the fact precisely, give the number or formula if applicable, and flag the most common way it's misremembered.",
      "icon": "📌",
      "children": [{ "id": "b1-1", "title": "Critical fact (2-4 words)", "detail": "State the fact precisely. Give the exact figure, date, or formula. One memory hook. One common mistake." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Must-Know Facts, Key Formulas, Common Mistakes, Quick Definitions, Memory Aids, Exam Tips
2. Each branch has exactly 3 children
3. Key Formulas must state the formula, define each variable, and name one trap (e.g., wrong unit, sign error)
4. Common Mistakes must name the specific error students make AND what to do instead
5. Exam Tips must be tactical (e.g., "always check units", "draw the diagram first") not motivational ("believe in yourself")
6. Return ONLY valid JSON.`;
}

function revisionExpandPrompt(branchTitle, contextTopic) {
    return `You are expanding the revision section "${branchTitle}" for the topic "${contextTopic}".

Generate ALL revision items a student needs — every high-yield fact. No fixed limit.
Number each by exam frequency (1 = most commonly tested).

Every item: state the fact precisely, give the exact formula or number where applicable, include a memory hook, and name the most common mistake.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Item (2-4 words)", "summary": "Key point (max 5 words)", "detail": "State fact precisely. Formula/number if applicable. Memory hook. Common mistake to avoid." }]
Return ONLY JSON.`;
}

function careerGeneratePrompt(topic) {
    return `You are a senior career strategist and industry insider mapping the career landscape for: "${topic}".

Every node must give actionable, specific intelligence — real job titles, real salary ranges, real tools, real timelines.

Generate JSON:
{
  "central": { "title": "Career: (short field name)", "icon": "🚀" },
  "branches": [
    {
      "id": "b1", "category": "Industry Overview",
      "title": "The Landscape",
      "summary": "Market size and key players (max 8 words)",
      "detail": "3-4 sentences. Sentence 1: state the industry's current size, growth rate, or hiring volume with a real figure. Sentence 2: name the top 3-5 employers or sectors driving demand. Sentence 3: describe the dominant business model or how the industry makes money. Sentence 4: identify one major shift currently reshaping the field.",
      "icon": "🌍",
      "children": [{ "id": "b1-1", "title": "Key sector (2-4 words)", "detail": "2-3 sentences: name specific companies or organizations in this sector, describe what roles they hire, state typical entry-level vs senior compensation." }]
    }
  ]
}

RULES:
1. Exactly 6 branches: Industry Overview, Required Skills, Entry Points, Growth Ladder, Salary & Demand, Future Trends
2. Each branch has exactly 3 children
3. Required Skills must name specific tools, languages, frameworks, or certifications (not generic "communication skills")
4. Entry Points must name real job titles and realistic time-to-hire estimates
5. Salary & Demand must include real salary ranges (e.g., "$65k-$95k entry, $120k-$180k senior in the US") and demand metrics
6. Future Trends must name specific technologies or regulatory changes already in motion
7. Return ONLY valid JSON.`;
}

function careerExpandPrompt(branchTitle, contextTopic) {
    return `You are a career industry expert expanding "${branchTitle}" in the career guide for "${contextTopic}".

Generate ALL important career insights — every actionable piece of intelligence. No fixed limit.
Number each by career impact (1 = most impactful).

Every item must be specific: name real tools, real job titles, real salary figures, or real certifications. No generic advice.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Insight (2-4 words)", "summary": "Actionable takeaway (max 5 words)", "detail": "2-3 sentences. Name specific tools, titles, salary figures, or certifications. State what to do and what outcome to expect." }]
Return ONLY JSON.`;
}

function dataIntegrationGeneratePrompt(topic, rawDataContent) {
    return `You are a senior data architect analyzing the following raw data and building a structured mind map.
Topic/Source: "${topic}"

RAW DATA CONTENT:
${rawDataContent || 'No data provided.'}

Your goal: make the structure, relationships, and key facts of this data immediately understandable to someone seeing it for the first time. Be precise — name actual fields, tables, values, and relationships from the data.

Generate JSON:
{
  "central": { "title": "Data: (short 2-3 words)", "icon": "🗃️" },
  "branches": [
    {
      "id": "b1", "category": "Core Structure",
      "title": "Main Area (e.g. Users Table or Chapter 1)",
      "summary": "What this section contains (max 8 words)",
      "detail": "3-4 sentences. Name the actual fields or concepts present. Describe the relationships or dependencies. Identify the primary key or main identifier if applicable. Flag any anomaly or notable pattern in the data.",
      "icon": "📊",
      "children": [{ "id": "b1-1", "title": "Specific field or concept (2-4 words)", "detail": "2-3 sentences: data type or nature, what it represents, how it relates to other fields or concepts in the data." }]
    }
  ]
}

RULES:
1. Exactly 6 branches representing the main logical groupings (e.g., tables, document sections, entity clusters)
2. Each branch has exactly 3 children representing specific fields, columns, or sub-concepts
3. Reference actual content from the raw data — not generic descriptions
4. For database schemas: group by conceptual entity. For text documents: group by theme or section
5. Return ONLY valid JSON.`;
}

function dataIntegrationExpandPrompt(branchTitle, contextTopic, rawDataContent) {
    return `You are a data architect expanding on "${branchTitle}" from the data source "${contextTopic}".

RAW DATA CONTENT:
${rawDataContent || 'No data provided.'}

Generate ALL relevant specific details for this branch — reference actual fields, values, and relationships from the raw data. No fixed limit.

JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Detail (2-4 words)", "summary": "Key fact (max 5 words)", "detail": "2-3 sentences: state the exact field name or concept, describe its data type and constraints, explain its relationship to other fields or entities in the data." }]
Return ONLY JSON.`;
}

// ─── Visualization ─────────────────────────────────────────────────────────────

export function buildVisualizePrompt(nodeTitle, nodeDetail, childNodes, mapTopic, mapMode) {
    const childSummary = childNodes.length > 0
        ? childNodes.map(n => `- ${n.title}: ${n.detail || ''}`).join('\n')
        : 'No child nodes.';

    return `You are a senior content strategist producing a PREMIUM animated explainer — think BBC documentary meets high-quality YouTube. Every scene must be packed with specific, verifiable facts. Zero filler, zero vague generalities.

Topic: "${mapTopic}" | Mode: ${mapMode}
Node: "${nodeTitle}"
Detail: "${nodeDetail}"
Related concepts:
${childSummary}

Generate 9-12 scenes covering origin, mechanism, real data, real examples, implications, and key takeaways. Every scene adds NEW information — no repetition.

SCENE CONTENT REQUIREMENTS:
- "intro": Headline that states a striking specific fact or bold claim. Subtext sets up exactly what the viewer will learn.
- "context": Body explains WHY this matters right now (cite a real current trend, number, or event). Bullets give 3 specific context points with real data or names.
- "timeline": Exactly 4 milestones. Each event must name a real year AND a specific occurrence (e.g., "1969 — ARPANET connects UCLA and Stanford, sends first 2-letter message 'LO' before crashing"). No vague entries.
- "stat": One specific verifiable number. Subtext explains what the number means and why it matters — 2 sentences minimum, no "this shows that..." padding.
- "steps": Exactly how the mechanism or process works. Each step is 1-2 sentences of precise, technical description — not a vague phase label.
- "fact": 4 counterintuitive or little-known facts, each citing a real name, date, or source.
- "example": A real company, person, or project. Case describes what specifically happened (with dates/numbers). Result states the measurable outcome.
- "quote": A real, verbatim quote from a named expert or historical figure. Attribution includes full name and role. No invented quotes.
- "outro": The single most important takeaway + what the viewer should do next with this knowledge.

Return ONLY valid JSON in this exact structure:
{
  "title": "string (compelling, specific explainer title)",
  "scenes": [
    {
      "style": "intro",
      "duration": 5,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (punchy, max 10 words — lead with a specific fact or bold claim)",
      "subtext": "string (1-2 sentences: what specifically will the viewer learn and why it matters)"
    },
    {
      "style": "context",
      "duration": 6,
      "accent": "#f97316",
      "icon": "emoji",
      "headline": "string (the core problem or opportunity, max 8 words)",
      "body": "string (2-3 sentences — cite a real current trend, statistic, or event)",
      "bullets": ["string (specific context point with a real number, name, or date)", "string", "string"]
    },
    {
      "style": "timeline",
      "duration": 8,
      "accent": "#f59e0b",
      "icon": "emoji",
      "headline": "string (e.g. How It All Began)",
      "events": [
        { "year": "string (real year)", "event": "string (specific: names, actions, outcomes — 1 sentence)" },
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
      "subtext": "string (2 sentences — explain the magnitude and the real-world implication)"
    },
    {
      "style": "steps",
      "duration": 9,
      "accent": "#8b5cf6",
      "icon": "emoji",
      "headline": "string (e.g. How It Works — Step by Step)",
      "steps": [
        "string (step 1 — precise technical description, 1-2 sentences, no vague labels)",
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
      "bullets": ["string (counterintuitive fact with a real name, date, or source)", "string", "string", "string"]
    },
    {
      "style": "example",
      "duration": 6,
      "accent": "#10b981",
      "icon": "emoji",
      "headline": "string (e.g. Case Study: [Real Company or Person Name])",
      "case": "string (what specifically happened — names, dates, numbers, actions)",
      "result": "string (the measurable outcome — specific figures if available)"
    },
    {
      "style": "quote",
      "duration": 5,
      "accent": "#06b6d4",
      "quote": "string (real verbatim quote — no paraphrasing, no invented quotes)",
      "attribution": "string (full name, title, and year or context)"
    },
    {
      "style": "outro",
      "duration": 5,
      "accent": "#00d4ff",
      "icon": "emoji",
      "headline": "string (the single most important takeaway, max 8 words)",
      "subtext": "string (2 sentences — what to remember and the concrete next step)"
    }
  ]
}

HARD RULES:
- stat.value must be a plain number (e.g. 4500000000 not "4.5B")
- Icons must be single emoji characters
- Vary accent colors across scenes
- Every bullet, event, step, and body field must contain real, specific content — no placeholders like "important metric here"
- Cover all dimensions: origin story, how it works, real data, real examples, implications`;
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
