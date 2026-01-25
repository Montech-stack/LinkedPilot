import { NextRequest, NextResponse } from "next/server";

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

        // Use Imagen 4.0 model via REST API
        // Confirmed working model: models/imagen-4.0-generate-001
        const modelName = "models/imagen-4.0-generate-001";
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:predict?key=${API_KEY}`;

        // Construct Payload for Imagen
        // Note: If sourceImages are present, this model might not support editing via this endpoint structure directly
        // without specific instance keys (e.g. 'image' for mask-based editing).
        // For now, we focus on Generation.

        const payload: any = {
            instances: [
                { prompt: prompt }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1" // Default square, can be adjusted
            }
        };

        if (sourceImages && sourceImages.length > 0) {
            console.warn("⚠️ Source images provided but experimental Imagen editing support is limited via this endpoint. Proceeding with Generation based on prompt.");
            // In a future update, we could try adding 'image': { bytesBase64Encoded: ... } to instances if the model supports it.
        }

        console.log(`⬆️ Sending Request to ${modelName}...`);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Generation Failed:", errorText);
            return NextResponse.json({
                error: "Image generation failed",
                details: errorText
            }, { status: response.status });
        }

        const data = await response.json();

        // Extract image
        // Response format: { predictions: [ { bytesBase64Encoded: "..." } ] }
        const prediction = data.predictions?.[0];
        const base64Image = prediction?.bytesBase64Encoded || prediction?.image?.bytesBase64Encoded;

        if (!base64Image) {
            console.error("❌ No image data in response:", JSON.stringify(data));
            return NextResponse.json({ error: "Model returned no image data" }, { status: 500 });
        }

        const imageUrl = `data:image/png;base64,${base64Image}`;

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