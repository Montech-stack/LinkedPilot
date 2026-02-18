import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // Convert File to Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        // Use Gemini 1.5 Flash for Multimodal (Audio -> Text)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const prompt = `
            You are an expert transcriber and social media editor.
            Listen to this audio. It is a user dictating an idea for a social media post.
            
            1. Transcribe the audio accurately.
            2. If the user gives instructions like "Make this into a LinkedIn post", follow them.
            3. If it's just raw rambling, format it into a coherent draft post.
            4. Remove filler words (um, uh, like).
            
            Output ONLY the final formatted text for the post. Do not add "Here is the transcript".
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "audio/webm", // OR file.type if reliable
                    data: base64Audio
                }
            },
            { text: prompt }
        ]);

        const text = result.response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Transcription Error:", error);
        return NextResponse.json({ error: "Failed to transcribe" }, { status: 500 });
    }
}
