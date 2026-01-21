import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { idea, platforms = ["LinkedIn"], length, count } = await request.json();

    if (!idea || !length || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    } catch (trendError) {
      console.error("Failed to fetch trends:", trendError);
    }

    const trendsClause = trends.length > 0
      ? `When relevant, you may subtly reference these trending topics: ${trends.join(', ')}.`
      : '';

    const now = new Date();

    const wordCount =
      length === 'short'
        ? 'Brief (under 280 chars for Twitter, under 100 words for others)'
        : length === 'medium'
          ? 'Medium length (100-200 words)'
          : 'Long form (200-400 words)';

    // Join platforms for the general context, but we will iterate in the prompt
    const platformList = Array.isArray(platforms) ? platforms : [platforms];
    const platformNames = platformList.join(', ');

    // =====================================================
    // 🔥 UPGRADED PROMPT FOR MULTI-PLATFORM
    // =====================================================
    const prompt = `
Generate ${count} distinct social media post(s) for EACH of the following platforms: ${platformNames}.
Based on the idea: "${idea}".

TOTAL POSTS TO GENERATE per platform: ${count}. (If 2 platforms and count 1, generate 1 for each).

Your mission: **maximize engagement and virality** specific to each platform's culture in 2024–2025.

PLATFORM SPECIFIC INSTRUCTIONS:
- **LinkedIn**: Professional, value-driven, storytelling, "bro-etry" usage if effective, clear takeaways.
- **Twitter / X**: If length is 'short', standard tweet. If 'medium' or 'long', create a **THREAD**. For threads, separate tweets with "---". Tone: Punchy, contrarian, high-signal.
- **Instagram**: Visual-first captions, engaging hooks, use of emojis, "Link in bio" CTA.
- **Facebook**: Conversational, community-focused, storytelling.

GENERAL RULES:
1. **Hook**: Start with a scroll-stopping hook.
2. **Value**: Provide actionable insight or emotional resonance.
3. **Structure**: Use short paragraphs and white space.
4. **Dates**: Today is ${now.toLocaleDateString()}.
5. **Trends**: ${trendsClause}

LENGTH: ${wordCount}.

OUTPUT FORMAT:
Return a valid JSON array of objects. Each object must have:
- "id": A unique string ID.
- "platform": The platform name (e.g. "LinkedIn", "Twitter").
- "content": The full post text.
- "note": A short note on why this works for this platform.

Example JSON:
[
  { "id": "1", "platform": "Twitter", "content": "Hook... \n\nBody...", "note": "Thread structure used" },
  { "id": "2", "platform": "LinkedIn", "content": "Hook... \n\nBody...", "note": "Professional formatting" }
]
    `;

    const generatedContent = await generateContent(prompt, { maxTokens: 4000 });

    // Remove code fences
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '')
      .replace(/```/g, '')
      .trim();

    let posts: any[];

    try {
      posts = JSON.parse(cleanedContent);

      if (!Array.isArray(posts)) {
        throw new Error('Invalid post format: not an array');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw:', cleanedContent);
      // Simple repair
      if (cleanedContent.indexOf('[') !== -1 && cleanedContent.lastIndexOf(']') !== -1) {
        const sub = cleanedContent.substring(cleanedContent.indexOf('['), cleanedContent.lastIndexOf(']') + 1);
        try { posts = JSON.parse(sub); } catch (e) { throw new Error("Failed to parse AI response"); }
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    const timestamp = Date.now();

    // Sanitize and ID
    posts = posts.map((post, index) => {
      // Clean content
      let content = post.content || "";
      // Strip asterisks if they are excessive, but bolding is okay.
      // Actually Markdown is good.
      return {
        id: post.id || `${timestamp}-${index}`,
        platform: post.platform || "Unknown",
        content: content,
        note: post.note
      };
    });

    return NextResponse.json({ posts, success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating post:', errorMessage);

    return NextResponse.json(
      { error: `Failed to generate post: ${errorMessage}` },
      { status: 500 }
    );
  }
}