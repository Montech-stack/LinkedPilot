
export interface CredibilityResult {
    score: number; // 0-100
    flaggedWords: string[];
    feedback: string;
}

const AI_ISMS = [
    "delve",
    "tapestry",
    "unlock",
    "unleash",
    "transformative",
    "landscape",
    "testament",
    "poised",
    "realm",
    "fast-paced",
    "ever-evolving",
    "game-changer",
    "demystify",
    "leverage",
    "harness",
    "cutting-edge",
    "groundbreaking",
    "paradigm shift",
    "underscore",
    "foster",
    "cultivate",
    "navigating",
    "comprehensive",
    "robust",
    "optimize",
    "streamline"
];

export function analyzeCredibility(text: string): CredibilityResult {
    const lowerText = text.toLowerCase();
    const flaggedWords: string[] = [];

    AI_ISMS.forEach(word => {
        if (lowerText.includes(word.toLowerCase())) {
            flaggedWords.push(word);
        }
    });

    // Score calculation: Start at 100, deduct 5 points per "AI-ism"
    let score = 100 - (flaggedWords.length * 5);

    // Additional deduction for predictable structure (e.g. "In conclusion")
    if (lowerText.includes("in conclusion") || lowerText.includes("in summary")) {
        score -= 10;
        flaggedWords.push("Generic Conclusion");
    }

    if (score < 0) score = 0;

    let feedback = "High Credibility - Sounds Human.";
    if (score < 90) feedback = "Moderate Credibility - Some AI patterns detected.";
    if (score < 70) feedback = "Low Credibility - Heavy AI jargon detected.";

    return {
        score,
        flaggedWords,
        feedback
    };
}
