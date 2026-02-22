import { Search, BookOpen, Lightbulb, ClipboardList, Link2, RefreshCcw, Rocket, Database } from 'lucide-react';

export const MODES = {
  research: {
    id: 'research',
    label: 'Research',
    icon: 'Search',
    emoji: '🔬',
    description: 'Explore any topic broadly and discover all its facets',
    color: 'var(--accent-cyan)',
    categories: ['Foundation', 'Applications', 'Challenges', 'Trends', 'Key Players', 'Future Outlook'],
    generatePrompt: (topic) => `
You are an expert researcher creating a comprehensive visual mind map for: "${topic}".

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
8. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are diving deeper into "${branchTitle}" within "${contextTopic}".
Generate ALL important sub-concepts — do NOT limit yourself to a fixed number. Include every concept that matters.
Number each item by importance (1 = most important).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Concept (2-4 words)", "summary": "Hook (max 5 words)", "detail": "2-3 sentences with analogy/example. Explain WHY it matters." }]
Be SPECIFIC and COMPREHENSIVE. Use simple language. Return ONLY JSON.`
  },

  learning: {
    id: 'learning',
    label: 'Learning Path',
    icon: 'BookOpen',
    emoji: '📚',
    description: 'Structured beginner-to-expert learning journey',
    color: 'var(--accent-green)',
    categories: ['Prerequisites', 'Core Concepts', 'Intermediate', 'Advanced', 'Practice Projects', 'Mastery Path'],
    generatePrompt: (topic) => `
You are a world-class tutor designing a LEARNING PATH for: "${topic}".

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
6. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are a tutor expanding on "${branchTitle}" in the learning path for "${contextTopic}".
Generate ALL important lessons and skills — include every concept that a learner needs. No fixed limit.
Number each by learning priority (1 = learn first).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Skill/Lesson (2-4 words)", "summary": "Quick hook (max 5 words)", "detail": "2-3 sentences. What to learn, HOW to practice it, and a real-world analogy." }]
Make it ACTIONABLE. Return ONLY JSON.`
  },

  brainstorm: {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: 'Lightbulb',
    emoji: '💡',
    description: 'Creative ideation and problem-solving framework',
    color: 'var(--accent-orange)',
    categories: ['Problem Statement', 'Wild Ideas', 'Feasible Solutions', 'Unique Angles', 'Combinations', 'Action Steps'],
    generatePrompt: (topic) => `
You are a creative innovation consultant brainstorming on: "${topic}".

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
4. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are a creative consultant expanding "${branchTitle}" for brainstorming "${contextTopic}".
Generate ALL relevant creative ideas — include every approach worth considering. No fixed limit.
Number each by impact potential (1 = highest impact).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Idea (2-4 words)", "summary": "Spark (max 5 words)", "detail": "2-3 sentences. Be CREATIVE and UNEXPECTED. Use 'What if...' framing." }]
Think WILD. Return ONLY JSON.`
  },

  study: {
    id: 'study',
    label: 'Study Guide',
    icon: 'ClipboardList',
    emoji: '🗺️',
    description: 'Exam-ready study material with key concepts and practice',
    color: 'var(--accent-purple)',
    categories: ['Key Definitions', 'Core Theories', 'Important Formulas', 'Common Mistakes', 'Practice Questions', 'Quick Review'],
    generatePrompt: (topic) => `
You are a top teacher creating an EXAM STUDY GUIDE for: "${topic}".

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
4. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are expanding the study guide section "${branchTitle}" for "${contextTopic}".
Generate ALL important study items — include every concept students need to know. No fixed limit.
Number each by exam importance (1 = most likely to appear).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Study item (2-4 words)", "summary": "Key point (max 5 words)", "detail": "2-3 sentences. Include a mnemonic, practice question, or common mistake to avoid." }]
Return ONLY JSON.`
  },

  connect: {
    id: 'connect',
    label: 'Connect',
    icon: 'Link2',
    emoji: '🔗',
    description: 'Discover surprising connections between any two topics',
    color: 'var(--accent-pink)',
    categories: ['Shared Foundations', 'Parallel Concepts', 'Cross Applications', 'Key Differences', 'Synthesis Ideas', 'Combined Future'],
    generatePrompt: (topic) => `
You are a polymath finding CONNECTIONS between topics in: "${topic}".

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
5. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are exploring connections in "${branchTitle}" between the topics in "${contextTopic}".
Generate ALL meaningful cross-connections — include every surprising link. No fixed limit.
Number each by surprise factor (1 = most unexpected).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Connection (2-4 words)", "summary": "Bridge (max 5 words)", "detail": "2-3 sentences on a surprising link. Use a concrete example." }]
Be SURPRISING. Return ONLY JSON.`
  },

  revision: {
    id: 'revision',
    label: 'Revision',
    icon: 'RefreshCcw',
    emoji: '🔄',
    description: 'Quick-fire revision cards to test and reinforce your knowledge',
    color: 'var(--accent-yellow)',
    categories: ['Must-Know Facts', 'Key Formulas', 'Common Mistakes', 'Quick Definitions', 'Memory Aids', 'Exam Tips'],
    generatePrompt: (topic) => `
You are an expert tutor creating a REVISION MAP for: "${topic}".

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
3. Must-Know Facts: The top facts that appear on every exam
4. Key Formulas: Essential equations, rules, or frameworks
5. Common Mistakes: What students always get wrong
6. Quick Definitions: Terms you MUST know cold
7. Memory Aids: Mnemonics, acronyms, visual tricks
8. Exam Tips: Strategy and timing advice for this specific topic
9. Be CONCISE, MEMORABLE, and EXAM-FOCUSED
10. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are expanding the revision section "${branchTitle}" for "${contextTopic}".
Generate ALL important revision items — include everything a student needs to revise. No fixed limit.
Number each by exam frequency (1 = most commonly tested).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Item (2-4 words)", "summary": "Key point (max 5 words)", "detail": "2-3 sentences. Be CONCISE. Include a memory trick or common mistake to avoid." }]
Return ONLY JSON.`
  },

  career: {
    id: 'career',
    label: 'Career Path',
    icon: 'Rocket',
    emoji: '🚀',
    description: 'Map out career trajectories, skills, and opportunities',
    color: 'var(--accent-blue)',
    categories: ['Industry Overview', 'Required Skills', 'Entry Points', 'Growth Ladder', 'Salary & Demand', 'Future Trends'],
    generatePrompt: (topic) => `
You are an elite career advisor mapping the career landscape for: "${topic}".

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
3. Industry Overview: Big picture of the field
4. Required Skills: Hard and soft skills ranked by importance
5. Entry Points: How to break in — education, bootcamps, self-taught paths
6. Growth Ladder: Junior → Mid → Senior → Leadership trajectory
7. Salary & Demand: Realistic compensation ranges and job market outlook
8. Future Trends: Where this career is heading in 5-10 years
9. Be SPECIFIC with real job titles, salary ranges, and tools
10. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic) => `
You are expanding "${branchTitle}" in the career guide for "${contextTopic}".
Generate ALL important career insights — include every actionable piece of advice. No fixed limit.
Number each by career impact (1 = most impactful).
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Insight (2-4 words)", "summary": "Key takeaway (max 5 words)", "detail": "2-3 sentences with SPECIFIC advice — mention real tools, job titles, or salary figures when relevant." }]
Be ACTIONABLE and SPECIFIC. Return ONLY JSON.`
  },
  dataIntegration: {
    id: 'data-integration',
    label: 'Data Explorer',
    icon: 'Database',
    emoji: '🗄️',
    description: 'Map out personal documents, Drive folders, or Database schemas',
    color: 'var(--accent-cyan)',
    categories: ['Core Structure', 'Key Entities', 'Relationships', 'Main Concepts', 'Attributes', 'Summary Insights'],
    generatePrompt: (topic, rawDataContent) => `
You are an expert data architect analyzing the following raw user data.
Topic/Source: "${topic}"

RAW DATA CONTENT:
${rawDataContent || "No data provided."}

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
4. Return ONLY valid JSON.`,
    expandPrompt: (branchTitle, contextTopic, rawDataContent) => `
You are expanding on "${branchTitle}" from the data source "${contextTopic}".
Use the following RAW DATA to provide deeper insights:

RAW DATA CONTENT:
${rawDataContent || "No data provided."}

Generate ALL relevant specific details regarding this branch. No fixed limit.
JSON array format:
[{ "id": "unique-id", "rank": 1, "title": "Detail (2-4 words)", "summary": "Quick note", "detail": "2-3 sentences explaining this specific column, entity, or document fact." }]
Return ONLY JSON.`
  }
};

export const MODE_LIST = [
  MODES.research,
  MODES.brainstorm,
  MODES.connect,
  MODES.learning,
  MODES.revision,
  MODES.study,
  MODES.career,
  MODES.dataIntegration
];
export const DEFAULT_MODE = 'research';

// Get lucide icon component by mode id
export const getModeIcon = (modeId) => {
  const icons = { research: Search, learning: BookOpen, brainstorm: Lightbulb, study: ClipboardList, connect: Link2, revision: RefreshCcw, career: Rocket, 'data-integration': Database };
  return icons[modeId] || Search;
};
