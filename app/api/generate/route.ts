import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { idea, tone, length, count } = await request.json();

    if (!idea || !tone || !length || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch trending topics
    let trends = [];
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
      ? `When relevant, subtly blend one or more trending topics to increase freshness: ${trends.join(', ')}.`
      : '';

    const now = new Date();

    const uniquenessClause = `

Avoid clichés, avoid robotic phrasing, and avoid repetitive patterns.
Include small twists, curiosity, and tension to keep the user reading.

Date reference for freshness: ${now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}.
`;

    const wordCount =
      length === 'short'
        ? '50-100 words'
        : length === 'medium'
        ? '100-200 words'
        : '200-300 words';

    // =====================================================
    // 🔥 UPGRADED PROMPT
    // =====================================================
    const prompt = `
Generate ${count} fresh, original, deeply engaging LinkedIn post(s) using a ${tone} tone based on the idea: "${idea}".

Your mission: **maximize LinkedIn virality in 2024–2025** using:
- Curiosity hooks
- Pattern interrupts
- Emotional tension + payoff
- Saveable insights
- Comment-provoking CTAs
- List styles and frameworks

STRICT RULES:

1. **Hook Format**  
   Start with a sharp, emotional, bold, contrarian, or curiosity hook.


3. **Transformation**  
   Show a clear mindset shift or discovery.

4. **Create simple frameworks**  
   Example:
   - “The Scofield Method”
   - “The Focus Ladder”
   - “The 2-Minute Reset Rule”

5. **Short Paragraphs**  
   Maximize readability + dwell time.

6. Actionable Value
   Include 2–4 simple, practical action points that clearly stand out.
   Use hyphens like this:
   - Do this first…
   - Then apply this…
   - Finally adjust this…

   Do NOT use numbered lists or asterisks.
   ONLY use hyphens for bullet points.


7. **Emotional Resonance**  
   Use phrases like:

   - “That moment changed everything…”

8. **Use 3–8 emojis naturally**  
   Not spammy, not forced.

9. **Strong CTA**  
   Ask a comment-style question:
   - “What shift are you making next?”

10. **Hashtags**  
   Add 3–5 relevant hashtags at the bottom.

STRUCTURE VARIATION ACROSS POSTS:
- Listicle posts
- Framework-based posts
- Truth-bomb/contrarian posts
- Question-first posts
- Poll-style concept posts (text only)

LENGTH:  
Each post must be ${wordCount}.  
No markdown.  
No asterisks.  
No repetitive AI patterns.

TRENDS:  
${trendsClause}

UNIQUENESS:  
${uniquenessClause}

OUTPUT FORMAT:  
Return ONLY valid JSON array with ${count} objects:
[
  {
    "id": "timestamp-index/${count}",
    "content": "full post text"
  }
]
    `;

    const generatedContent = await generateContent(prompt, { maxTokens: 3000 });

    // Remove code fences
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '')
      .replace(/```/g, '')
      .trim();

    let posts;

    try {
      posts = JSON.parse(cleanedContent);

      if (!Array.isArray(posts) || !posts.every(p => p.id && p.content)) {
        throw new Error('Invalid post format');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw:', cleanedContent);

      // Soft repair attempt
      if (cleanedContent.endsWith('[') || cleanedContent.endsWith('{')) {
        cleanedContent += ']}';
      } else if (cleanedContent.includes('[') && !cleanedContent.endsWith(']')) {
        cleanedContent = cleanedContent.replace(/,\s*$/, '') + ']';
      }

      try {
        posts = JSON.parse(cleanedContent);
      } catch (secondError) {
        console.error('Second parse fail:', secondError);

        // Fallback posts
        posts = Array.from({ length: count }, (_, index) => ({
          id: `${Date.now()}-${index}/${count}`,
          content: `Default generated post for: ${idea}.`
        }));
      }
    }

    const timestamp = Date.now();

    // Cleanup
    posts = Array.from({ length: count }, (_, index) => {
      const post = posts[index] || {};
      let content = post.content || `Default content for: ${idea}.`;
      content = content.replace(/\*/g, '');
      return {
        id: post.id || `${timestamp}-${index}/${count}`,
        content
      };
    });

    return NextResponse.json({ posts, success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating post:', errorMessage);

    return NextResponse.json(
      { error: `Failed to generate post: ${errorMessage}` },
      { status: errorMessage.includes('Rate limit') ? 429 : 500 }
    );
  }
}