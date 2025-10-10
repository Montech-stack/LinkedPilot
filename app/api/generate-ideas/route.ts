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
  "category": string (must be one of: "Controversial", "Question", "Story", "List", "Career Advice"),
  "hook": string,
  "engagement": "Very High" | "High" | "Medium",
  "score": number between 70 and 95,
  "keywords": array of 5-7 relevant keywords
}

Ensure each idea has a unique category from the list provided.
Output only a valid JSON array, no other text.`;

    const generatedContent = await generateContent(prompt, { maxTokens: 3000 });

    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, '')
      .replace(/```/g, '')
      .trim();

    let ideas;
    try {
      ideas = JSON.parse(cleanedContent);
      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error('Generated content is not a valid JSON array');
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
        ideas = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        console.error('Second parse attempt failed:', secondParseError);
        // Fallback to manual parsing
        ideas = cleanedContent.split('\n').filter(line => line.trim()).map((line, index) => ({
          category: ['Controversial', 'Question', 'Story', 'List', 'Career Advice'][index % 5],
          hook: line.includes('"hook":') ? JSON.parse(`{${line}}`).hook : `Default hook for ${input} #${index + 1}`,
          engagement: 'Medium',
          score: 80 + index,
          keywords: input.split(' ').slice(0, 7),
        }));
      }
    }

    // Validate and complete ideas
    const validCategories = ['Controversial', 'Question', 'Story', 'List', 'Career Advice'];
    const defaultKeywords = input.split(' ').slice(0, 7);
    ideas = Array(5).fill(null).map((_, index) => {
      const idea = ideas[index] || {};
      return {
        category: validCategories.includes(idea.category) ? idea.category : validCategories[index],
        hook: idea.hook || `Default hook for ${input} #${index + 1}`,
        engagement: ['Very High', 'High', 'Medium'].includes(idea.engagement) ? idea.engagement : 'Medium',
        score: Math.min(95, Math.max(70, idea.score || 80 + index)),
        keywords: Array.isArray(idea.keywords) && idea.keywords.length >= 5 ? idea.keywords.slice(0, 7) : defaultKeywords,
      };
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