import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log("\n====================== API /generate HIT ======================");

    const API_KEY = process.env.OPENROUTER_API_KEY;
    if (!API_KEY) {
      console.error("❌ Missing OPENROUTER_API_KEY");
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const body = await req.json();

    console.log("➡️ Incoming Body:", JSON.stringify(body, null, 2));

    // 🎯 FIX 1: Destructure sourceImages (plural, the array from the frontend)
    const { prompt, sourceImages } = body;

    if (!prompt) {
      console.error("❌ Missing prompt");
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Start content with the text prompt
    const content: any[] = [{ type: "text", text: prompt }];

    // 🎯 FIX 2: Check if sourceImages is a non-empty array and iterate
    if (sourceImages && Array.isArray(sourceImages) && sourceImages.length > 0) {
        console.log(`🖼️ Attaching ${sourceImages.length} Source Image(s) for Editing.`);
        
        sourceImages.forEach((sourceImage: string, index: number) => {
            console.log(`  - Image ${index + 1}: ${sourceImage.slice(0, 80)}...`);
            content.push({
                type: "image_url",
                image_url: { url: sourceImage },
            });
        });
    }

    const payload = {
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "system",
          content: "You are an expert photo editor. Your task is to use the provided image as the source and the provided text as the modification instruction. Generate a new image that implements the requested change. Only output the generated image.",
        },
        {
          role: "user",
          content,
        },
      ],
    };

    console.log("⬆️ Sending Payload to OpenRouter:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app-domain.com",
        "X-Title": "Photo Studio AI",
      },
      body: JSON.stringify(payload),
    });

    console.log("\n=== OpenRouter HTTP RESPONSE ===");
    console.log("HTTP Status:", response.status);
    console.log("HTTP StatusText:", response.statusText);

    const rawText = await response.text();
    // ... (rest of the response handling remains the same)
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Failed to parse JSON from OpenRouter:", err);
      return NextResponse.json(
        { error: "Malformed JSON from model", raw: rawText },
        { status: 500 }
      );
    }

    console.log("\n=== Parsed JSON response: ===");
    console.dir(data, { depth: null });

    if (!response.ok) {
      console.error("❌ OpenRouter returned error:", data);
      return NextResponse.json(
        {
          error: data?.error || "Model error",
          details: data,
        },
        { status: response.status }
      );
    }

    const message = data?.choices?.[0]?.message;

    const imageUrl = message?.images?.[0]?.image_url?.url || null;

    console.log("✅ Extracted Image URL:", imageUrl ? imageUrl.slice(0, 80) + "..." : "NO IMAGE FOUND");

    if (!imageUrl) {
      console.error("❌ Model returned no image");
      return NextResponse.json(
        {
          error: "Model did not return an image",
          details: message,
        },
        { status: 500 }
      );
    }

    console.log("✅ SUCCESS — returning image to client");
    console.log("===============================================================\n");

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
    });

  } catch (err: any) {
    console.error("🚨 SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Server Error", details: err.message },
      { status: 500 }
    );
  }
}