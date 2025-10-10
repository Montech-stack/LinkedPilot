import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { idea, tone, length, count } = await request.json();

    if (!idea || !tone || !length || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const wordCount = length === 'short' ? '50-100 words' : length === 'medium' ? '100-200 words' : '200-300 words';
    const maxTokens = length === 'short' ? 200 : length === 'medium' ? 400 : 600;

    const prompt = `Generate ${count} LinkedIn post(s) with a ${tone} tone based on the idea: "${idea}".

Each post should:
- Be approximately ${wordCount}.
- Use proven psychological triggers (e.g., curiosity, urgency, storytelling, or actionable insights) to maximize engagement.
- Include a strong hook in the first sentence to stop the scroll.
- End with a call-to-action (e.g., "What’s your take? Comment below!" or "DM me to learn more!").
- Avoid jargon unless relevant to the topic.
- Be formatted for LinkedIn (concise paragraphs, 1-2 emojis for emphasis, hashtags relevant to the topic).

Return a JSON array of ${count} objects, each with:
{
  "id": string (format: "${Date.now()}-{index}/${count}", e.g., "1760048817326-0/6"),
  "content": string (the full post text, ready to be shared on LinkedIn),
  "engagement": "Very High" | "High" | "Medium" (based on estimated virality),
  "score": number (70-95, reflecting quality and engagement potential)
}

Ensure each post is unique and tailored to the ${tone} tone.
Output only a valid JSON array, no other text.`;

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

    // Validate and complete posts
    const timestamp = Date.now();
    posts = Array.from({ length: count }, (_, index) => {
      const post = posts[index] || {};
      return {
        id: post.id || `${timestamp}-${index}/${count}`,
        content: post.content || `Default post for "${idea}" in ${tone} tone (${wordCount}). #${idea.replace(/\s+/g, '')}`,
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