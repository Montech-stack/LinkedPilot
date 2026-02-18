import { NextResponse } from "next/server";
import { addDays, setHours, startOfToday } from "date-fns";
import { generateContent } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { niche, audience, platform, frequency } = body;

        // Calculate count based on frequency
        let count = 12; // Default
        if (frequency === "daily") count = 30; // One month
        if (frequency === "weekdays") count = 22;
        if (frequency === "weekly") count = 4;

        // Construct Prompt
        const prompt = `
            You are a world-class content strategist for a personal brand.
            Generate ${count} highly engaging, specific content ideas for a "${niche}" brand targeting "${audience}" on "${platform}".

            REQUIREMENTS:
            1. **Variety**: Mix educational, personal stories, contrarian views, and actionable advice.
            2. **Specificity**: Avoid generic advice like "Be consistent". Give specific angles like "My 3-step checklist for consistency".
            3. **Hooks**: Write the idea as a compelling "Headline" or "Hook" that would actually work on social media.
            4. **Hashtags**: Include 2-3 relevant hashtags for each idea.

            OUTPUT FORMAT:
            Return ONLY a raw JSON array of strings. 
            Example: ["The exact email template I use to close clients #sales #freelancing", "Why I stopped using Todoist (and what I use instead) #productivity #tech"].
            
            Do not include markdown formatting (like \`\`\`json) or any other text.
            ensure every single item has hashtags.
        `;

        // Call Gemini
        const aiResponse = await generateContent(prompt, { temperature: 0.8 });

        // Clean and Parse Response
        let ideas: string[] = [];
        try {
            const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
            ideas = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse AI response", aiResponse);
            // Fallback if JSON fails - splitting by newlines and cleaning
            ideas = aiResponse.split("\n")
                .map(line => line.replace(/^[-*•\d\.]+\s/, "").trim()) // Remove bullets/numbers
                .filter(line => line.length > 5)
                .slice(0, count);
        }

        // Schedule Ideas
        const results = [];
        let currentDate = startOfToday();

        for (let i = 0; i < ideas.length; i++) {
            currentDate = getNextDate(currentDate, frequency);

            results.push({
                content: ideas[i], // The real AI idea
                platform: platform,
                scheduledAt: setHours(currentDate, 10).toISOString() // 10 AM default
            });
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error("AI Generation failed", error);
        return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
    }
}

function getNextDate(date: Date, frequency: string): Date {
    let nextDate = addDays(date, 1);
    const day = nextDate.getDay(); // 0 = Sun, 6 = Sat

    if (frequency === "daily") return nextDate;

    if (frequency === "weekdays") {
        if (day === 0) return addDays(nextDate, 1); // Sun -> Mon
        if (day === 6) return addDays(nextDate, 2); // Sat -> Mon
        return nextDate;
    }

    if (frequency === "3_times_week") {
        // Mon, Wed, Fri
        if (day === 1 || day === 3 || day === 5) return nextDate;
        // If Tue (2) -> Wed (3)
        if (day === 2) return addDays(nextDate, 1);
        // If Thu (4) -> Fri (5)
        if (day === 4) return addDays(nextDate, 1);
        // If Sat (6) -> Mon (1+2 = 3 days? No, next Mon)
        if (day === 6) return addDays(nextDate, 2);
        // If Sun (0) -> Mon
        if (day === 0) return addDays(nextDate, 1);
        return nextDate; // Should cover it
    }

    if (frequency === "weekly") {
        return addDays(date, 7);
    }

    return nextDate;
}
