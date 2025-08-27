import { type NextRequest, NextResponse } from "next/server"

// Simple retry function to handle network timeouts
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
      console.log(`Attempt ${i + 1}/${retries} to ${url}`, { headers: options.headers, body: options.body });
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (response.ok) return response
      const errorData = await response.text()
      console.error(`HTTP error ${response.status}: ${errorData}`)
      throw new Error(`HTTP error ${response.status}: ${errorData}`)
    } catch (error: any) {
      console.error(`Retry ${i + 1}/${retries} failed:`, error.message, error.cause || "")
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1))) // Exponential backoff
    }
  }
  throw new Error("Max retries reached")
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY")
      return NextResponse.json({ error: "Server configuration error: Missing OpenRouter API key" }, { status: 500 })
    }

    const { idea, tone, count = 3, length = "medium" } = await request.json()

    if (!idea || !tone) {
      return NextResponse.json({ error: "Missing required fields: idea and tone" }, { status: 400 })
    }

    const postCount = Math.min(Math.max(1, Number.isNaN(Number.parseInt(count)) ? 3 : Number.parseInt(count)), 100)
    const validLengths = ["short", "medium", "long"]
    if (!validLengths.includes(length)) {
      return NextResponse.json({ error: `Invalid length: must be one of ${validLengths.join(", ")}` }, { status: 400 })
    }

    const lengthParams = {
      short: "50-100 words, concise and punchy",
      medium: "100-200 words, balanced and engaging",
      long: "200+ words, detailed and comprehensive",
    }

    const lengthInstruction = lengthParams[length as keyof typeof lengthParams] || lengthParams.medium

    const prompt = `You are a LinkedIn content expert. Create ${postCount} different versions of a LinkedIn post using the input below.

Idea: ${idea}
Tone: ${tone}
Length: ${lengthInstruction}
Number of posts: ${postCount}

Each post should:
- Have a strong hook in the first 2 lines that stops the scroll
- Be ${lengthInstruction}
- Include relevant emojis naturally (but not excessively)
- End with a CTA or open-ended question to drive engagement
- Be structured to spark comments, shares, and conversation
- Sound authentic and human, not robotic
- Use proven psychological triggers (curiosity, controversy, storytelling, etc.)

Make each version distinctly different in approach while maintaining the ${tone} tone. Use different hooks, angles, and engagement strategies for each post.

Return only the ${postCount} posts, separated by "---" between each post.`

    const models = ["deepseek/deepseek-r1:free"];
    let response: Response | null = null;
    let lastError: any = null;

    for (const model of models) {
      try {
        response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LinkedPilot",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are an expert LinkedIn content creator who specializes in viral posts that drive engagement. You understand psychology, storytelling, and what makes content shareable on professional networks.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: length === "long" ? 2000 : length === "short" ? 1000 : 1500,
            temperature: 0.8,
          }),
        })
        break; // Exit loop if request succeeds
      } catch (error: any) {
        lastError = error;
        console.error(`Failed with model ${model}:`, error.message);
        if (model === models[models.length - 1]) {
          throw lastError; // Throw the last error if all models fail
        }
      }
    }

    if (!response) {
      throw lastError || new Error("No response from any model");
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      console.error("No content received from OpenRouter API")
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    }

    // Clean markdown code fences and extra text
    const cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, "") // Remove ```json and ```
      .replace(/```/g, "") // Remove any stray ```
      .trim()

    const posts = cleanedContent
      .split("---")
      .map((post: string) => post.trim())
      .filter((post: string) => post.length > 0)
      .slice(0, postCount)

    if (posts.length === 0) {
      console.error("No valid posts generated:", cleanedContent)
      return NextResponse.json({ error: "No valid posts generated" }, { status: 500 })
    }

    return NextResponse.json({
      posts,
      success: true,
      count: posts.length,
      length: length,
      tone: tone,
    })
  } catch (error: any) {
    console.error("Error generating posts:", error.message, error.cause || "", "Raw response:", error.response?.data || error.message)
    if (error.message.includes("HTTP error 402")) {
      return NextResponse.json(
        {
          error:
            "OpenRouter API request failed due to payment issues or free-tier limits. Please check your account credits, API key, or rate limits at https://openrouter.ai/settings. You can also check service status at https://status.openrouter.ai.",
        },
        { status: 402 }
      )
    }
    return NextResponse.json({ error: `Failed to generate posts: ${error.message}` }, { status: 500 })
  }
}