import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        console.log("\n====================== API /generateImages HIT ======================");

        const API_KEY = process.env.GEMINI_IMAGE_KEY;
        if (!API_KEY) {
            console.error("❌ Missing GEMINI_IMAGE_KEY");
            return NextResponse.json({ error: "Missing API key" }, { status: 500 });
        }

        const body = await req.json();
        console.log("➡️ Incoming Body:", JSON.stringify(body, null, 2));

        const { prompt, sourceImages } = body;

        if (!prompt) {
            console.error("❌ Missing prompt");
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Initialize Gemini Client
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Use the model available to the key (gemini-2.5-flash-image)
        // Note: If this model is text-to-text only, this will fail to produce an image.
        // But given the name, it implies image capabilities.
        // If this fails to produce an image, we might need to look into 'imagen' models specifically.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

        const parts: any[] = [{ text: prompt }];

        // Handle source images if present (for editing contexts)
        if (sourceImages && Array.isArray(sourceImages) && sourceImages.length > 0) {
            console.log(`🖼️ Processing ${sourceImages.length} Source Image(s)...`);

            for (const imgUrl of sourceImages) {
                if (!imgUrl) continue;
                try {
                    console.log(`  - Fetching: ${imgUrl.slice(0, 50)}...`);
                    const imageResp = await fetch(imgUrl);
                    if (!imageResp.ok) throw new Error(`Failed to fetch ${imgUrl}`);
                    const arrayBuffer = await imageResp.arrayBuffer();
                    const base64Data = Buffer.from(arrayBuffer).toString("base64");
                    const mimeType = imageResp.headers.get("content-type") || "image/png";

                    parts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    });
                } catch (e: any) {
                    console.error(`  ❌ Failed to download image ${imgUrl}:`, e.message);
                }
            }
        }

        console.log("⬆️ Sending Request to Gemini...");
        const result = await model.generateContent(parts);
        const response = await result.response;

        // Attempt to extract image from response candidates
        let generatedImageBase64 = null;
        let generatedImageMimeType = null;

        // Access raw candidates
        const candidates = (response as any).candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts || [];
            for (const part of parts) {
                if (part.inlineData) {
                    generatedImageBase64 = part.inlineData.data;
                    generatedImageMimeType = part.inlineData.mimeType;
                    break;
                }
            }
        }

        let imageUrl = null;
        if (generatedImageBase64) {
            imageUrl = `data:${generatedImageMimeType || "image/png"};base64,${generatedImageBase64}`;
            console.log("✅ Extracted Image Data URI");
        }

        if (!imageUrl) {
            let generatedText = "";
            try { generatedText = response.text(); } catch (e) { }

            console.warn("⚠️ No image data found in response.");
            if (generatedText) {
                console.log("Model returned text:", generatedText.slice(0, 100));
                return NextResponse.json({
                    error: "Model returned text instead of image",
                    details: generatedText
                }, { status: 400 });
            }
            return NextResponse.json({ error: "Model returned no content" }, { status: 500 });
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