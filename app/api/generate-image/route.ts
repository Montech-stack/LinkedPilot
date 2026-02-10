import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// Initialize Gemini with the paid API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check user plan
        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Free users cannot generate images
        if (user.plan === "free") {
            return NextResponse.json(
                { error: "Image generation requires a paid plan. Please upgrade to continue." },
                { status: 403 }
            );
        }

        // Check tokens for non-enterprise users
        if (user.plan !== "enterprise" && user.tokensRemaining < 1) {
            return NextResponse.json(
                { error: "Insufficient tokens. Please purchase more tokens or upgrade your plan." },
                { status: 402 }
            );
        }

        const { prompt, style = "professional", aspectRatio = "1:1" } = await req.json();

        if (!prompt || prompt.trim().length === 0) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Build an enhanced prompt for social media images
        const enhancedPrompt = buildImagePrompt(prompt, style, aspectRatio);

        // Use Gemini's image generation model
        // Note: Gemini 2.0 Flash has native image generation
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseModalities: ["Text", "Image"]
            }
        } as any);

        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;

        // Extract the image from the response
        let imageData: string | null = null;
        let imageType: string | null = null;

        if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    imageData = part.inlineData.data;
                    imageType = part.inlineData.mimeType;
                    break;
                }
            }
        }

        if (!imageData) {
            return NextResponse.json(
                { error: "Failed to generate image. Try a different prompt." },
                { status: 500 }
            );
        }

        // Deduct token for non-enterprise users
        if (user.plan !== "enterprise") {
            await User.updateOne(
                { email: session.user.email },
                { $inc: { tokensRemaining: -1 } }
            );
        }

        return NextResponse.json({
            success: true,
            image: {
                data: imageData,
                mimeType: imageType,
                dataUrl: `data:${imageType};base64,${imageData}`
            }
        });

    } catch (error: any) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}

function buildImagePrompt(prompt: string, style: string, aspectRatio: string): string {
    const styleGuides: Record<string, string> = {
        professional: "Clean, modern, corporate aesthetic with subtle gradients and professional lighting",
        creative: "Vibrant colors, dynamic compositions, artistic and eye-catching",
        minimalist: "Simple, clean, lots of white space, elegant and sophisticated",
        bold: "High contrast, striking visuals, attention-grabbing colors",
        tech: "Futuristic, digital, with tech elements like circuits, code, or holographic effects",
        lifestyle: "Warm, inviting, authentic lifestyle photography style",
    };

    const styleDescription = styleGuides[style] || styleGuides.professional;

    return `Create a high-quality social media image for the following concept:

CONCEPT: ${prompt}

STYLE REQUIREMENTS:
- ${styleDescription}
- Optimized for ${aspectRatio} aspect ratio
- Professional quality suitable for LinkedIn, Instagram, or other social platforms
- Clean composition with clear focal point
- Modern and engaging visual design
- No text or watermarks in the image

Generate a visually stunning image that would stop someone scrolling.`;
}
