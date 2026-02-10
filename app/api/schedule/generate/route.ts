import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";
import ScheduledPost from "@/models/ScheduledPost";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Import presets for prompt enhancement
const PRESET_PROMPTS: Record<string, string> = {
    "thought-leadership": "Write as an industry authority sharing a unique perspective. Open with a bold statement that challenges conventional wisdom. Support with evidence from experience. Use confident language without arrogance. End with a forward-looking insight.",
    "quick-tips": "Create a numbered list of 5-7 actionable tips. Each tip should be specific enough to implement today. Start each point with an action verb. Keep explanations to one sentence.",
    "personal-story": "Share a vulnerable personal moment - a failure, challenge, or turning point. Be specific about the situation and emotions. Extract 2-3 clear lessons. Write in first person with raw honesty.",
    "controversial-take": "Take a strong stance on a topic most people disagree with. Open with the controversial opinion directly. Support with logical reasoning and specific examples. Invite respectful debate.",
    "case-study": "Structure as a mini case study with three clear parts: the Challenge (specific problem), the Strategy (what was done differently), and the Result (measurable outcome with numbers if possible).",
    "question-hook": "Open with a provocative question that challenges assumptions or creates curiosity. Make it specific enough to resonate deeply. Follow with valuable insight that answers the question.",
    "list-post": "Format as a clean numbered list for easy scanning. Each point should deliver standalone value. Use parallel structure across all points. Start with the most compelling point.",
    "behind-scenes": "Pull back the curtain on a process, decision, or journey that usually stays hidden. Be specific about the messy reality, including mistakes and pivots. Make readers feel like insiders."
};

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);

        const {
            topics,
            frequency,
            tone = "Professional",
            platform,
            startDate,
            accountId,
            // New fields - default if missing
            preset,
            length = "medium",
            generateImage = false
        } = await req.json();

        // Build length instruction
        const lengthInstruction = length === 'short'
            ? 'Keep posts brief - under 100 words, punchy and impactful'
            : length === 'long'
                ? 'Write longer posts of 200-400 words with detailed insights and examples'
                : 'Write medium-length posts of 100-200 words with balanced depth';

        // Build preset instruction
        const presetInstruction = preset && PRESET_PROMPTS[preset]
            ? `\nCONTENT STYLE: ${PRESET_PROMPTS[preset]}`
            : '';

        // Platform-specific guidance
        const platformGuide: Record<string, string> = {
            'LinkedIn': `
        - Open with a pattern-interrupting first line that stops the scroll
        - Use short paragraphs of 1-2 sentences max with blank lines between
        - Include a personal angle or story element when possible
        - End with a clear call-to-action or thought-provoking question
        - Writing style: Confident, conversational, valuable`,
            'Twitter': `
        - For longer content, create thread format with numbered tweets
        - Start with an irresistible hook that creates curiosity
        - Keep each point sharp and memorable
        - Writing style: Punchy, contrarian, high-signal`,
            'Instagram': `
        - Lead with an emotional hook that connects to the visual experience
        - Use strategic line breaks for mobile readability
        - Include 3-5 relevant hashtags at the end
        - End with engagement prompt or call-to-action`,
            'Facebook': `
        - Conversational and community-focused tone
        - Storytelling approach that invites discussion
        - Ask questions that encourage comments
        - Relatable, warm, and inclusive language`
        };

        const prompt = `
You are an elite social media ghostwriter who creates viral, engaging content.

Create a content calendar for the next 4 weeks (28 days) based on:
- Topic(s): ${topics}
- Frequency: ${frequency} posts per week
- Tone: ${tone}
- Platform: ${platform}
- Start Date: ${startDate}

CRITICAL RULES:
- Do NOT use asterisks or any markdown formatting in post content
- Write in plain text only with natural line breaks
- Use emojis sparingly and only where they add value
${presetInstruction}

${lengthInstruction}

PLATFORM GUIDANCE for ${platform}:
${platformGuide[platform] || platformGuide['LinkedIn']}

QUALITY STANDARDS:
1. HOOK: First line must create urgency or curiosity
2. VALUE: Every sentence must earn its place - cut fluff ruthlessly
3. AUTHENTICITY: Write like a real human, not corporate copy
4. SPECIFICITY: Use concrete examples and numbers over vague claims
5. EMOTION: Tap into desires, fears, frustrations, or aspirations

For each post, provide:
1. The post content (engaging, viral hooks, NO asterisks or markdown)
2. The scheduled date (YYYY-MM-DD format)
3. A suggested time (HH:MM format)

Output ONLY a valid JSON array of objects with keys: "content", "date", "time".
Do not include markdown ticks, asterisks, or additional text.

Example format:
[
  {"content": "Your compelling post here...", "date": "2024-01-15", "time": "09:00"},
  {"content": "Another engaging post...", "date": "2024-01-17", "time": "12:00"}
]
    `;

        // Use our robust helper instead of direct SDK usage
        // Note: generateContent returns a string directly
        const generatedText = await generateContent(prompt, { maxTokens: 8192 });

        // Robust JSON parsing (handles markdown blocks if present)
        let text = generatedText.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim();

        let plan = [];
        try {
            plan = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse AI response", text);
            // Try to extract JSON array
            const match = text.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    plan = JSON.parse(match[0]);
                } catch {
                    // Last ditch: try to fix common JSON errors if needed, but for now just fail gracefully
                    return NextResponse.json({ error: "Failed to generate valid plan format" }, { status: 500 });
                }
            } else {
                return NextResponse.json({ error: "Failed to generate valid plan structure" }, { status: 500 });
            }
        }

        // Save to DB
        const createdPosts = [];
        for (const item of plan) {
            if (!item.date || !item.content) continue;

            // Clean asterisks from content
            let cleanContent = item.content
                .replace(/\*\*/g, '')  // Remove bold markdown
                .replace(/\*/g, '')    // Remove remaining asterisks
                .replace(/_{2,}/g, '') // Remove underscores used for emphasis
                .trim();

            // Construct date object
            const dateTimeString = `${item.date}T${item.time || "12:00"}:00`;
            const scheduledAt = new Date(dateTimeString);

            const newPost = await ScheduledPost.create({
                linkedinId: accountId || session?.user?.id || "default_user_account",
                content: cleanContent,
                scheduledAt: scheduledAt,
                posted: false,
                platform: platform.toLowerCase(),
                generateImage: generateImage, // Store flag for image generation
            });
            createdPosts.push(newPost);
        }

        return NextResponse.json({ success: true, count: createdPosts.length, posts: createdPosts });

    } catch (error) {
        console.error("Calendar Generation Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Error" }, { status: 500 });
    }
}
