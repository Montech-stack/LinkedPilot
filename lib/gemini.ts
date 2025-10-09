export async function generateContent(prompt: string, options: {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
} = {}) {
  const { maxTokens = 1500, temperature = 0.8, topK = 40, topP = 0.95 } = options;

  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    throw new Error("Server configuration error");
  }

  try {
    console.log('Sending Gemini API request with prompt length:', prompt.length);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature,
            topK,
            topP,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );

    console.log('Gemini API response status:', response.status);
    const data = await response.json();
    console.log('Gemini API full response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Gemini API error response:', JSON.stringify(data, null, 2));
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Try again later.');
      }
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(`No candidates returned from Gemini. Response: ${JSON.stringify(data, null, 2)}`);
    }

    if (!data.candidates[0].content?.parts?.[0]?.text) {
      throw new Error(`No content in candidates. Response: ${JSON.stringify(data, null, 2)}`);
    }

    const content = data.candidates[0].content.parts[0].text.trim();
    console.log('Gemini API generated content length:', content.length);
    console.log('Token usage:', JSON.stringify(data.usageMetadata, null, 2));
    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini API error:', errorMessage);
    throw new Error(errorMessage);
  }
}