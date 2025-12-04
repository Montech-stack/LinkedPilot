import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  try {
    const { idea, tone, length, count } = await request.json();

    if (!idea || !tone || !length || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch current trending topics for uniqueness
    let trends = [];
    try {
      const trendsResponse = await fetch('https://getdaytrends.com/');
      const trendsHtml = await trendsResponse.text();
      const $ = cheerio.load(trendsHtml);
      $('ol.trend-card__list li a').each((i, el) => {
        if (i < 5) { // Top 5 trends
          trends.push($(el).text().trim());
        }
      });
    } catch (trendError) {
      console.error("Failed to fetch trends:", trendError);
      // Fallback: Use a default or skip
    }

    const trendsClause = trends.length > 0 
      ? `To make this post unique and timely, cleverly incorporate one or more of these current trending topics where relevant: ${trends.join(', ')}. Blend them naturally into the content without forcing it.`
      : '';

    // Additional clause for extra uniqueness (avoids generic AI output)
    const now = new Date();
    const uniquenessClause = `Make the post completely original by adding unexpected twists, personal anecdotes, or references to current events around ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Avoid common AI-generated patterns like overused phrases (e.g., 'delve into', 'unleash potential') or repetitive structures. If no trends are available, draw from random elements like a hypothetical user story or seasonal vibe to ensure diversity.`;

    const wordCount = length === 'short' ? '50-100 words' : length === 'medium' ? '100-200 words' : '200-300 words';
    const maxTokens = length === 'short' ? 200 : length === 'medium' ? 400 : 600;

    const prompt = `Generate ${count} highly engaging and relatable social media post(s) with a ${tone} tone based on the idea: "${idea}". Optimize for maximum virality across platforms like LinkedIn, Twitter (X), Facebook, Instagram, and TikTok, ensuring they can go viral on every platform.

${trendsClause}
${uniquenessClause}

Each post should:
- Be approximately ${wordCount} to fit platform limits (e.g., shorter for Twitter, more detailed for LinkedIn).
- Start with a powerful hook using curiosity, urgency, FOMO, or a provocative question to stop the scroll.
- Incorporate psychological triggers like storytelling, social proof, actionable insights, or emotional power words to boost shares and interactions.
- Use 3-8 relevant emojis for visual pop without overkill.
- End with a strong call-to-action and encourage them to follow for more (e.g., "What's your take? Drop a comment!", "Tag a friend who needs this!", "DM me for details!", or "Share if this resonates!").
- Include 3-5 targeted hashtags for discoverability (e.g., #ViralTopic, #IndustryInsight).
- Vary structures for uniqueness: e.g., question-based, listicle, story, tip, quote, or poll-style.
- Keep language conversational, relatable, and jargon-free unless topic-specific. Do not use asterisks (*) for emphasis or any purpose in the content—use emojis or rephrase instead.
- Ensure adaptability: Professional tone for LinkedIn, fun/concise for TikTok/Instagram, engaging for Facebook/Twitter.

Return a JSON array of ${count} objects, each with:
{
  "id": string (format: "${Date.now()}-{index}/${count}", e.g., "1760048817326-0/6"),
  "content": string (the full post text, ready to share),
  "engagement": "Very High" | "High" | "Medium" (estimated virality based on triggers and platform fit),
  "score": number (70-95, reflecting quality, originality, and engagement potential)
}

Output only a valid JSON array—no other text. Ensure diversity and high viral potential in each post.`;

    const generatedContent = await generateContent(prompt, { maxTokens: 3000 });

    // Clean markdown code fences and extra text
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '') // Remove ```json and ```
      .replace(/```/g, '') // Remove any stray ```
      .trim();

    let posts;
    try {
      posts = JSON.parse(cleanedContent);
      if (!Array.isArray(posts) || !posts.every(p => p.id && p.content && p.engagement && typeof p.score === 'number')) {
        throw new Error('Invalid post format');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw content:', cleanedContent);
      // Attempt to fix truncated JSON
      if (cleanedContent.endsWith('[') || cleanedContent.endsWith('{')) {
        cleanedContent += ']}';
      } else if (cleanedContent.includes('[') && !cleanedContent.endsWith(']')) {
        cleanedContent = cleanedContent.replace(/,\s*$/, '') + ']';
      }
      try {
        posts = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        console.error('Second parse attempt failed:', secondParseError);
        // Fallback: generate default posts
        posts = Array.from({ length: count }, (_, index) => ({
          id: `${Date.now()}-${index}/${count}`,
          content: `Default post for "${idea}" in ${tone} tone (${wordCount}). #${idea.replace(/\s+/g, '')}`,
          engagement: 'Medium',
          score: 80 + index,
        }));
      }
    }

    // Validate and complete posts, and remove any asterisks from content
    const timestamp = Date.now();
    posts = Array.from({ length: count }, (_, index) => {
      const post = posts[index] || {};
      let content = post.content || `Default post for "${idea}" in ${tone} tone (${wordCount}). #${idea.replace(/\s+/g, '')}`;
      content = content.replace(/\*/g, ''); // Remove any asterisks
      return {
        id: post.id || `${timestamp}-${index}/${count}`,
        content,
        engagement: ['Very High', 'High', 'Medium'].includes(post.engagement) ? post.engagement : 'Medium',
        score: Math.min(95, Math.max(70, post.score || 80 + index)),
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