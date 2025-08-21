import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { idea, tone, count = 3, length = "medium" } = await request.json()

    if (!idea || !tone) {
      return NextResponse.json({ error: "Missing required fields: idea and tone" }, { status: 400 })
    }

    const postCount = Math.min(Math.max(1, Number.parseInt(count) || 3), 100)

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4",
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
        max_tokens: length === "long" ? 3000 : length === "short" ? 1500 : 2000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
    }

    const posts = generatedContent
      .split("---")
      .map((post: string) => post.trim())
      .filter((post: string) => post.length > 0)
      .slice(0, postCount)

    return NextResponse.json({
      posts,
      success: true,
      count: posts.length,
      length: length,
      tone: tone,
    })
  } catch (error) {
    console.error("Error generating posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}