import { GoogleGenerativeAI } from "@google/generative-ai";
import { MOCK_INITIAL_MAP, MOCK_EXPANSION } from './mockData';
import { MODES } from '../config/modes';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const useMock = !API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.85,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
}) : null;

// Helper to parse JSON from AI response
const parseResponse = (text) => {
  try {
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    // Try to extract JSON from text with extra content
    const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch {}
    }
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid format received from AI");
  }
};

export const generateMap = async (topic, modeId = 'research', rawDataContent = null) => {
  if (useMock) {
    console.log("Using Mock API for Map Generation");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_INITIAL_MAP), 800));
  }

  const mode = MODES[modeId] || MODES.research;
  const prompt = mode.generatePrompt(topic, rawDataContent);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseResponse(text);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const expandBranch = async (branchTitle, contextTopic, modeId = 'research', rawDataContent = null) => {
  if (useMock) {
    console.log("Using Mock API for Expansion");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_EXPANSION), 600));
  }

  const mode = MODES[modeId] || MODES.research;
  const prompt = mode.expandPrompt(branchTitle, contextTopic, rawDataContent);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseResponse(text);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

/**
 * Ask a question about a node with optional streaming support.
 * @param {Object} node - The node object
 * @param {string} question - User question
 * @param {string} contextTopic - Map topic
 * @param {string} modeId - Mode ID
 * @param {Array} parentChain - Array of parent node data objects from central to immediate parent
 * @param {Function|null} onChunk - Streaming callback; receives the accumulated text so far
 */
export const askNodeQuestion = async (
  node,
  question,
  contextTopic,
  modeId = 'research',
  parentChain = [],
  onChunk = null
) => {
  if (useMock) {
    const mockText = "This is a mock answer. Configure your API key to get real AI responses from Neuro.";
    if (onChunk) {
      // Simulate streaming
      for (let i = 10; i <= mockText.length; i += 10) {
        await new Promise(r => setTimeout(r, 80));
        onChunk(mockText.slice(0, i));
      }
      onChunk(mockText);
    }
    return mockText;
  }

  const mode = MODES[modeId] || MODES.research;

  // Build parent chain context (from central root → direct parent)
  let chainContext = '';
  if (parentChain.length > 0) {
    const chainStr = parentChain
      .map((n, i) => `${'  '.repeat(i)}${i === 0 ? '🎯' : '→'} ${n.title}`)
      .join('\n');
    chainContext = `\nKnowledge Hierarchy (path to this node):\n${chainStr}\n  → 📍 ${node.data?.title} (current)\n`;
  }

  const prompt = `You are Neuro, a brilliant AI tutor with encyclopedic knowledge and the ability to explain anything clearly and engagingly.

CONTEXT:
- Map Topic: "${contextTopic}"
- Current Node: "${node.data?.title}" (${node.data?.category || node.type || 'concept'})
- Node Description: "${node.data?.detail || node.data?.summary || 'No description'}"${chainContext}
- Learning Mode: ${mode.label} — ${mode.description}

USER QUESTION: "${question}"

RESPONSE GUIDELINES:
- Answer in the spirit of ${mode.label} mode — match its tone and depth
- Be comprehensive, specific, and insightful — don't be shallow
- Use concrete real-world examples and analogies that stick
- Structure your answer with clear flow — use numbered lists (1. 2. 3.) or natural paragraphs
- If this node has parent context, connect your answer to the broader hierarchy
- Keep the response engaging and conversational
- Do NOT use markdown asterisks (** or *) — write naturally without formatting symbols
- Do NOT use bullet points with hyphens — use numbered lists or natural prose
- Use plain text only — no markdown, no HTML`;

  try {
    if (onChunk) {
      // Streaming mode for instant feedback
      const result = await model.generateContentStream(prompt);
      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onChunk(fullText);
      }
      return fullText;
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error("API Error:", error);
    if (onChunk) onChunk("Sorry, I couldn't generate an answer at this moment.");
    return "Sorry, I couldn't generate an answer at this moment.";
  }
};

export const generateQuiz = async (topic, levelTitle, modeId = 'research') => {
  const mode = MODES[modeId] || MODES.research;

  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve({
      question: `[${mode.label}] What is a key concept related to "${topic}"?`,
      options: ["Concept A", "Concept B", "Concept C", "Concept D"],
      correctIndex: 1,
      explanation: `Concept B is critical in the context of ${mode.label} for ${topic}.`
    }), 500));
  }

  let contextInstruction = "";
  switch (mode.id) {
    case 'career':
      contextInstruction = "GOAL: Help the user understand the career landscape. Ask about REQUIRED SKILLS, JOB ROLES, SALARY EXPECTATIONS, and INDUSTRY TRENDS.";
      break;
    case 'learning':
      contextInstruction = "GOAL: Take the user from beginner to mastery. Ask about PREREQUISITES, FUNDAMENTAL CONCEPTS, and ADVANCED TOPICS.";
      break;
    case 'revision':
      contextInstruction = "GOAL: Rapid-fire test of recall. Ask about KEY FACTS, DEFINITIONS, and MEMORIZATION items.";
      break;
    case 'study':
      contextInstruction = "GOAL: Prepare the user for an EXAM. Ask about CORE THEORIES, FORMULAS, and COMMON PITFALLS.";
      break;
    case 'brainstorm':
      contextInstruction = "GOAL: Spark creative thinking. Ask about UNCONVENTIONAL SOLUTIONS, 'WHAT IF' SCENARIOS, and PROBLEM-SOLVING angles.";
      break;
    default:
      contextInstruction = "GOAL: Deep technical understanding. Ask about DEFINITIONS, MECHANISMS, and NUANCED DETAILS.";
  }

  const prompt = `Act as an expert EXAMINER conducting a viva/oral exam on "${topic}".
${contextInstruction}

Generate a SINGLE multiple-choice question to test mastery of: "${topic}".

CRITICAL RULES:
1. Test the USER'S KNOWLEDGE of the subject matter itself
2. Do NOT ask about the "mind map", "nodes", or "structure"
3. Difficulty: "${levelTitle}" (Novice = easy/fundamental, Grandmaster = complex/application-based)
4. Make it thought-provoking and educational

JSON Format: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Clear, educational explanation of why the answer is correct." }
Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseResponse(response.text());
  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw error;
  }
};

// Predict which branch most likely contains a concept
export const predictBranch = async (concept, branchTitles, mapTopic) => {
  if (useMock || !model) return branchTitles[0] || null;

  const prompt = `Given a mind map about "${mapTopic}" with these branches:
${branchTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Which ONE branch most likely contains or relates to: "${concept}"?
Return ONLY the exact branch title text, nothing else. No quotes, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Branch prediction failed:", error);
    return branchTitles[0] || null;
  }
};
