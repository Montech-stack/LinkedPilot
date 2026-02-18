
import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { content, platform, instruction } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const platformGuide = platform === 'twitter' ? "Keep it under 280 characters, punchy, use threads if needed." :
            platform === 'linkedin' ? "Professional, spacing for readability, valuable insights." :
                "Engaging and clear.";

        const prompt = `
    You are an expert social media ghostwriter.
    Your goal is to make the following content go viral on ${platform || 'LinkedIn'}.

    Original Content:
    "${content}"

    Instruction: ${instruction || "Optimize for maximum engagement, clarity, and impact."}

    GUIDELINES:
    - Make the hook (first line) stop the scroll.
    - Use short, punchy sentences.
    - Add open loops or questions to drive comments.
    - Fix any grammar issues but keep the tone authentic.
    - ${platformGuide}

    CRITICAL:
    - You MUST include 3-5 relevant, high-traffic hashtags at the very bottom.
    - Do NOT add introductory text like "Here is the improved version". 
    - Output ONLY the final post text.
    `;

        const enhancedText = await generateContent(prompt, { maxTokens: 1000 });

        return NextResponse.json({ content: enhancedText.trim() });
    } catch (error) {
        console.error("Enhance Error:", error);
        return NextResponse.json({ error: "Failed to enhance content" }, { status: 500 });
    }
}
