
import { type NextRequest, NextResponse } from "next/server"

// Simple retry function to handle network timeouts
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (response.ok) return response
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP error ${response.status}: ${JSON.stringify(errorData)}`)
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
    const { input, previous = [] } = await request.json()

    if (!input) {
      return NextResponse.json({ error: "Missing required field: input" }, { status: 400 })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const previousStr = previous.length > 0 ? `Generate 5 more viral ideas different from these previous ones: \n${previous.join('\n')}` : "Generate the top 5 viral ideas"

    const prompt = `${previousStr}
Generate viral LinkedIn post ideas for the topic/niche: ${input}, based on what's trending on LinkedIn as of August 2025, such as AI-inspired content, long-form videos, employee-generated content, user-generated content, interactive posts, Meshtastic, AI note-taking, digital sustainability, AI for teachers, immersive experiences, remote work debates, productivity hacks, career advice, startup failures, and hiring trends in design skills and data-driven approaches.

Each idea should be a concise hook or title that can be turned into a post.

Return a JSON array of 5 objects, each with:
{
  "category": string (e.g., "Controversial", "Lesson Learned", "Question", "Story", "Behind the Scenes", "List", "Success Story", "Productivity", "Career Advice", "Industry Insight"),
  "hook": string (the viral idea hook),
  "engagement": "Very High" | "High" | "Medium",
  "score": number between 70 and 95,
  "keywords": array of 5-7 relevant keywords
}

Make sure the output is a valid JSON array only, no other text.`

    const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LinkedPilot",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "You are an expert in generating viral LinkedIn content ideas based on trends.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      console.error("No content received from OpenRouter API")
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    }

    // Clean markdown code fences and extra text
    let cleanedContent = generatedContent
      .replace(/```json\n|\n```/g, "") // Remove ```json and ```
      .replace(/```/g, "") // Remove any stray ```
      .trim()

    let ideas
    try {
      ideas = JSON.parse(cleanedContent)
      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error("Generated content is not a valid JSON array")
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw content:", generatedContent)
      return NextResponse.json({ error: "Invalid response format from API" }, { status: 500 })
    }

    return NextResponse.json({
      ideas,
      success: true,
    })
  } catch (error: any) {
    console.error("Error generating ideas:", error.message, error.cause || "", "Raw response:", error.response?.data || "No response data")
    return NextResponse.json({ error: `Failed to generate ideas: ${error.message}` }, { status: 500 })
  }
}