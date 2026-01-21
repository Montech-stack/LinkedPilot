import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ScheduledPost from "@/models/ScheduledPost";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth"; // If you use auth
// import { authOptions } from "@/lib/auth"; // Adjust path if needed

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { topics, frequency, tone, platform, startDate, accountId } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
      You are an expert social media manager.
      Create a content calendar for the next 4 weeks (28 days) based on:
      - Topic(s): ${topics}
      - Frequency: ${frequency} posts per week
      - Tone: ${tone}
      - Platform: ${platform}
      - Start Date: ${startDate}

      For each post, provide:
      1. The post content (engaging, viral hooks).
      2. The scheduled date (YYYY-MM-DD format).
      3. A suggested time (HH:MM format).

      Output ONLY a valid JSON array of objects with keys: "content", "date", "time".
      Do not include markdown ticks or additional text.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup potential markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let plan = [];
        try {
            plan = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse AI response", text);
            return NextResponse.json({ error: "Failed to generate valid plan" }, { status: 500 });
        }

        // Save to DB
        const createdPosts = [];
        for (const item of plan) {
            if (!item.date || !item.content) continue;

            // Construct date object
            const dateTimeString = `${item.date}T${item.time || "12:00"}:00`;
            const scheduledAt = new Date(dateTimeString);

            const newPost = await ScheduledPost.create({
                linkedinId: accountId || "default_user_account", // Fallback if no specific account selected
                content: item.content,
                scheduledAt: scheduledAt,
                posted: false,
            });
            createdPosts.push(newPost);
        }

        return NextResponse.json({ success: true, count: createdPosts.length, posts: createdPosts });

    } catch (error) {
        console.error("Calendar Generation Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
