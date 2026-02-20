import { GoogleGenerativeAI } from "@google/generative-ai";
import { MOCK_INITIAL_MAP, MOCK_EXPANSION } from './mockData';
import { MODES } from '../config/modes';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const useMock = !API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

// Helper to parse JSON from AI response
const parseResponse = (text) => {
  try {
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid format received from AI");
  }
};

export const generateMap = async (topic, modeId = 'research', rawDataContent = null) => {
  if (useMock) {
    console.log("Using Mock API for Map Generation");
    return new Promise(resolve => setTimeout(() => resolve(MOCK_INITIAL_MAP), 1500));
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
    return new Promise(resolve => setTimeout(() => resolve(MOCK_EXPANSION), 1000));
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

export const askNodeQuestion = async (node, question, contextTopic, modeId = 'research') => {
  if (useMock) {
    return new Promise(resolve => setTimeout(() => resolve("This is a mock answer. Configure your API key to get real AI responses."), 1000));
  }

  const mode = MODES[modeId] || MODES.research;
  const prompt = `
    You are an AI assistant helping a user explore the topic: "${node.data.title}".
    Context: This node is part of a mind map about "${contextTopic}".
    Node Detail: "${node.data.detail || ''}"
    Current Mode: ${mode.label} (${mode.description}).

    User Question: "${question}"

    Answer the question in DETAIL. Do not summarize. Provide comprehensive information, context, and examples if relevant. Break down complex points. Use the tone of the current mode.
    Return PLAIN TEXT.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("API Error:", error);
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
    }), 800));
  }

  // Base prompt instructions based on mode
  let contextInstruction = "";
  switch (mode.id) {
    case 'career':
      contextInstruction = "GOAL: Help the user understand the career landscape. Ask about REQUIRED SKILLS, JOB ROLES, SALARY EXPECTATIONS, and INDUSTRY TRENDS. Test their readiness for a job in this field.";
      break;
    case 'learning':
      contextInstruction = "GOAL: Take the user from beginner to mastery. Ask about PREREQUISITES, FUNDAMENTAL CONCEPTS, and ADVANCED TOPICS. Ensure they understand the 'why' and 'how'.";
      break;
    case 'revision':
      contextInstruction = "GOAL: Rapid-fire test of recall. Ask about KEY FACTS, DEFINITIONS, and MEMORIZATION items. Focus on things often forgotten.";
      break;
    case 'study':
      contextInstruction = "GOAL: Prepare the user for an EXAM. Ask about CORE THEORIES, FORMULAS, and COMMON PITFALLS. Make the questions exam-style.";
      break;
    case 'brainstorm':
      contextInstruction = "GOAL: Spark creative thinking. Ask about UNCONVENTIONAL SOLUTIONS, 'WHAT IF' SCENARIOS, and PROBLEM-SOLVING angles.";
      break;
    default: // research, connect
      contextInstruction = "GOAL: Deep technical understanding. Ask about DEFINITIONS, MECHANISMS, and NUANCED DETAILS of the topic.";
  }

  const prompt = `
    Act as an expert EXAMINER conducting a viva/oral exam on "${topic}".
    
    ${contextInstruction}
    
    Your task is to generate a SINGLE multiple-choice question to test the user's mastery of the specific concept: "${topic}".
    
    CRITICAL RULES:
    1. Test the USER'S KNOWLEDGE of the subject matter itself.
    2. Do NOT ask about the "mind map", "nodes", or "structure".
    3. Do NOT ask "What is a prerequisite for...?" -> instead, ask a question ABOUT that prerequisite.
    4. Difficulty should match the rank: "${levelTitle}" (Novice = fundamental/easy, Grandmaster = complex/nuanced/application-based).
    5. The question should be part of an infinite series covering the ENTIRE SCOPE of the topic.
    
    JSON Format: { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "Brief, educational explanation of why the answer is correct." }
    Return ONLY valid JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseResponse(text);
  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw error;
  }
};

// Predict which branch most likely contains a concept
export const predictBranch = async (concept, branchTitles, mapTopic) => {
  if (useMock || !model) return branchTitles[0] || null;

  const prompt = `
    Given a mind map about "${mapTopic}" with these branches:
    ${branchTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

    Which ONE branch most likely contains or relates to this concept: "${concept}"?
    Return ONLY the exact branch title text, nothing else. No quotes, no explanation.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Branch prediction failed:", error);
    return branchTitles[0] || null;
  }
};
