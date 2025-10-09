
import { type NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { input, previous = [] } = await request.json();

    if (!input) {
      return NextResponse.json({ error: 'Missing required field: input' }, { status: 400 });
    }

    const previousStr = previous.length > 0 
      ? `Exclude these previous ideas: \n${previous.join('\n')}\n\n` 
      : '';

    const prompt = `${previousStr}Generate 5 viral LinkedIn post ideas for the topic: ${input}.

Each idea should be a concise hook or title.

Return a JSON array of 5 objects, each with:
{
  "category": string (e.g., "Controversial", "Question", "Story", "List", "Career Advice"),
  "hook": string,
  "engagement": "Very High" | "High" | "Medium",
  "score": number between 70 and 95,
  "keywords": array of 5-7 relevant keywords
}

Output only a valid JSON array, no other text.`;

    const generatedContent = await generateContent(prompt, { maxTokens: 1500 });

    // Clean markdown code fences and extra text
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '') // Remove ```json and ```
      .replace(/```/g, '') // Remove any stray ```
      .trim();

    let ideas;
    try {
      ideas = JSON.parse(cleanedContent);
      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error('Generated content is not a valid JSON array');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw content:', generatedContent);
      // Fallback: parse text manually
      ideas = cleanedContent.split('\n').filter(line => line.trim()).map((line, index) => ({
        category: 'General',
        hook: line,
        engagement: 'Medium',
        score: 80 + index,
        keywords: input.split(' ').slice(0, 7),
      }));
    }

    // Cache ideas in MongoDB
    await fetch('http://localhost:3000/api/cache-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas }),
    });

    return NextResponse.json({
      ideas,
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating ideas:', error.message, error.cause || '', 'Raw response:', error.response?.data || 'No response data');
    return NextResponse.json(
      { error: `Failed to generate ideas: ${error.message}` },
      { status: error.message.includes('Rate limit') ? 429 : 500 }
    );
  }
}