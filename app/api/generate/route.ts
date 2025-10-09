import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { idea, tone, length, count } = await request.json();

    if (!idea || !tone || !length || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maxTokens = length === 'short' ? 100 : length === 'medium' ? 200 : 400;
    const prompt = `Generate ${count} LinkedIn post(s) with a ${tone} tone based on the idea: "${idea}".

Each post should be ${length} (approximately ${maxTokens / 2} words).

Return a JSON array of ${count} objects, each with:
{
  "content": string (the full post text, ready to be shared on LinkedIn)
}

Output only a valid JSON array, no other text.`;

    const generatedContent = await generateContent(prompt, { maxTokens: 1500 });

    // Clean markdown code fences and extra text
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '') // Remove ```json and ```
      .replace(/```/g, '') // Remove any stray ```
      .trim();

    let posts;
    try {
      posts = JSON.parse(cleanedContent);
      if (!Array.isArray(posts) || !posts.every(p => p.content)) {
        throw new Error('Invalid post format');
      }
    } catch {
      // Fallback: parse text as a single post
      posts = [{ content: cleanedContent }];
    }

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