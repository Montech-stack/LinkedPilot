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

  let attempt = 0;
  const maxRetries = 3;
  let response;
  let data;

  while (attempt <= maxRetries) {
    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⚠️ Gemini API overloaded/rate-limited. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`Sending Gemini API request (Attempt ${attempt + 1})...`);
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, topK, topP, maxOutputTokens: maxTokens },
          }),
        }
      );

      console.log('Gemini API response status:', response.status);
      data = await response.json();

      if (response.ok) {
        break; // Success!
      }

      // Handle retryable errors
      if (response.status === 503 || response.status === 429) {
        attempt++;
        continue;
      }

      // Fatal error
      console.error('Gemini API error response:', JSON.stringify(data, null, 2));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(data)}`);

    } catch (networkError) {
      // Network errors (like fetch failing) might also be worth retrying
      console.error(`Attempt ${attempt + 1} failed network error:`, networkError);
      if (attempt < maxRetries) {
        attempt++;
        continue;
      }
      throw networkError;
    }
  }

  if (!response || !response.ok) {
    throw new Error('Max retries exceeded for Gemini API');
  }

  // data has already been parsed above
  // console.log('Gemini API full response:', JSON.stringify(data, null, 2)); // Verbose logging removed for clarity

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
}