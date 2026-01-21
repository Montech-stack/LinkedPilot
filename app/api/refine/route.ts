import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { content, instruction } = await req.json();

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Default instruction if none provided
        const prompt = instruction
            ? `Rewrite the following social media post based on this instruction: "${instruction}".\n\nOriginal Post:\n"${content}"\n\nReturn ONLY the rewritten post text.`
            : `Improve the grammar and clarity of the following social media post to make it more professional and engaging:\n\n"${content}"\n\nReturn ONLY the improved post text.`;

        const text = await generateContent(prompt);

        return NextResponse.json({ refined: text.trim().replace(/^"|"$/g, '') });
    } catch (error) {
        console.error("Refine error:", error);
        return NextResponse.json({ error: "Failed to refine post" }, { status: 500 });
    }
}
