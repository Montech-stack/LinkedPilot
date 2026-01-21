import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { input, previous = [], tone, audience } = await request.json();
    if (!input) {
      return NextResponse.json({ error: 'Missing required field: input' }, { status: 400 });
    }

    // Fetch trending topics
    let trends: string[] = [];
    try {
      const trendsResponse = await fetch('https://getdaytrends.com/');
      const trendsHtml = await trendsResponse.text();
      const $ = cheerio.load(trendsHtml);

      $('ol.trend-card__list li a').each((i, el) => {
        if (i < 5) trends.push($(el).text().trim());
      });
    } catch (err) {
      console.error("Trend fetch failed:", err);
    }

    const trendsClause =
      trends.length > 0
        ? `Blend in one or more of these trending topics ONLY if they naturally fit: ${trends.join(", ")}.`
        : "";

    // Refined uniqueness clause
    const uniquenessClause = `
Ensure the ideas are completely non-generic by:
- Using short analogy-style references.
- Avoiding personal stories or fake claims.
- Avoiding corporate buzzwords.
- Making each idea visually scroll-stopping.
- Using zero markdown formatting.
- Varying pacing.
    `;

    const previousStr =
      previous.length > 0
        ? `Exclude these previous ideas entirely:\n${previous.join("\n")}\n\n`
        : "";

    const audienceStr = audience ? `TARGET AUDIENCE: ${audience}. tailored specifically for their pain points and language.` : "TARGET AUDIENCE: General professional audience.";
    const toneStr = tone ? `TONE: ${tone}.` : "TONE: Contrarian and bold.";

    const prompt = `
${previousStr}
Generate 5 viral social media content ideas for the topic: "${input}".
${audienceStr}
${toneStr}

Each idea must be platform-agnostic and optimized for virality across LinkedIn, Twitter/X, Instagram, TikTok, and Facebook.

${trendsClause}
${uniquenessClause}

CONTENT STRUCTURE FOR EACH IDEA:
- Start with a single-sentence HOOK that is emotional, curiosity-based, or contrarian.
- Each idea must belong to one of these categories (no repeats): Controversial, Question, Story, List, Career Advice.
- Each hook must feel like something a top creator would actually post.
- Hooks must feel *human*, not AI-generated.
- No clichés, no TED-talk tone, no over-polished robotic structure.

STYLE REQUIREMENTS:
- Analogy references allowed (e.g., “Think of it like a pilot trying to take off with half a runway…”).
- Keep wording conversational and punchy.
- No hashtags.
- No emojis.
- No markdown or special characters like(*) except normal punctuation.

PSYCHOLOGY REQUIREMENTS:
Integrate at least one of these into each idea:
    - Curiosity gap
      - Shock value or myth - busting
        - FOMO or urgency
          - Micro - storytelling
          - Pattern interrupt
            - Practicality or unexpected lesson

RETURN FORMAT:
Return ONLY a JSON array of 5 items.Each item must be:

    {
      "category": "Controversial" | "Question" | "Story" | "List" | "Career Advice",
        "hook": "The viral-ready hook idea",
          "engagement": "Very High" | "High" | "Medium",
            "score": number between 70 and 95,
              "keywords": array of 3 - 5 relevant keywords
    }

Return ONLY the JSON array.No text outside JSON.
`;

    const generatedContent = await generateContent(prompt, {
      maxTokens: 3000,
    });

    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, "")
      .replace(/```/g, "")
      .trim();

    let ideas;
    try {
      ideas = JSON.parse(cleanedContent);
    } catch (err) {
      console.error("JSON parse error:", err, "Raw:", cleanedContent);

      // Attempt repair
      if (cleanedContent.includes("[") && !cleanedContent.endsWith("]")) {
        cleanedContent = cleanedContent.replace(/,\s*$/, "") + "]";
      }
      try {
        ideas = JSON.parse(cleanedContent);
      } catch {
        // Fallback minimal ideas
        ideas = Array(5)
          .fill(null)
          .map((_, i) => ({
            category: ["Controversial", "Question", "Story", "List", "Career Advice"][i],
            hook: `Default viral idea for ${input} #${i + 1}`,
            engagement: "Medium",
            score: 75 + i,
            keywords: input.split(" ").slice(0, 5),
          }));
      }
    }

    // Validate and normalize ideas
    const categories = ["Controversial", "Question", "Story", "List", "Career Advice"];
    const defaultKeywords = input.split(" ").slice(0, 5);

    ideas = Array(5)
      .fill(null)
      .map((_, index) => {
        const idea = ideas[index] || {};
        return {
          category: categories.includes(idea.category)
            ? idea.category
            : categories[index],
          hook: idea.hook || `Default hook for ${input} #${index + 1}`,
          engagement: ["Very High", "High", "Medium"].includes(idea.engagement)
            ? idea.engagement
            : "High",
          score: Math.min(95, Math.max(70, idea.score || 80 + index)),
          keywords: Array.isArray(idea.keywords) && idea.keywords.length >= 3
            ? idea.keywords.slice(0, 5)
            : defaultKeywords,
        };
      });

    return NextResponse.json({
      ideas,
      success: true,
    });
  } catch (error: any) {
    console.error("Error generating ideas:", error.message, error?.response?.data || "");
    return NextResponse.json(
      { error: `Failed to generate ideas: ${error.message}` },
      { status: error.message.includes("Rate limit") ? 429 : 500 }
    );
  }
}
