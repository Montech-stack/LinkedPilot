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
    // OPTIMIZED PROMPT FOR MULTI-PLATFORM CONTENT
    // =====================================================
    const prompt = `
You are an elite social media ghostwriter who has generated millions of impressions for thought leaders, coaches, and founders. Your content consistently goes viral because you understand human psychology and platform algorithms.

TASK: Generate ${count} high-performing social media post(s) for EACH of these platforms: ${platformNames}.
Based on this idea: "${idea}"

TOTAL OUTPUT: ${count} post(s) per platform.

CRITICAL FORMATTING RULES:
- Do NOT use asterisks or markdown formatting in your output
- Do NOT use bold, italic, or any special formatting characters
- Use plain text only with natural line breaks
- Use emojis sparingly and only where they add value

PLATFORM-SPECIFIC MASTERY:

LINKEDIN:
- Open with a pattern-interrupting first line that stops the scroll
- Use short paragraphs of 1-2 sentences max with blank lines between
- Include a personal angle or story element when possible
- End with a clear call-to-action or thought-provoking question
- Writing style: Confident, conversational, valuable

TWITTER/X:
- For short content: One punchy tweet with high signal-to-noise ratio
- For medium/long content: Create a thread format, separate each tweet with "---"
- Start with an irresistible hook that creates curiosity
- Each tweet should stand alone while building momentum
- Writing style: Sharp, contrarian, memorable

INSTAGRAM:
- Lead with an emotional hook that connects to the visual experience
- Use strategic line breaks for mobile readability
- Include 3-5 relevant hashtags at the end
- End with engagement prompt: question or call-to-action
- Add "Link in bio" if referencing external content

FACEBOOK:
- Conversational and community-focused tone
- Storytelling approach that invites discussion
- Ask questions that encourage comments
- Relatable, warm, and inclusive language

QUALITY STANDARDS:
1. HOOK: First line must create urgency or curiosity - make scrolling past impossible
2. VALUE: Every sentence must earn its place - cut fluff ruthlessly
3. AUTHENTICITY: Write like a real human, not a corporate copywriter
4. SPECIFICITY: Use concrete examples and numbers over vague claims
5. EMOTION: Tap into desires, fears, frustrations, or aspirations

CONTEXT:
- Current date: ${now.toLocaleDateString()}
- ${trendsClause}
- Target length: ${wordCount}

OUTPUT: Return a valid JSON array. Each object must contain:
- "id": Unique string identifier
- "platform": Platform name exactly as provided
- "content": The complete post text without any markdown or special formatting
- "note": 10-word max explanation of why this will perform well

JSON FORMAT EXAMPLE:
[
  { "id": "1", "platform": "LinkedIn", "content": "Your post content here...", "note": "Strong hook with personal story" },
  { "id": "2", "platform": "Twitter", "content": "Tweet content here...", "note": "Contrarian take creates engagement" }
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