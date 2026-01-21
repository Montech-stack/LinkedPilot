
import { NextResponse } from "next/server";
import { Draft } from "@/models/Draft";
import { connectToDatabase } from "@/lib/mongodb"; // Assuming this exists, I'll check imports elsewhere if this fails, but usually it's standard
import mongoose from "mongoose";

// Helper to connect if not using a lib helper
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI || "");
};

export async function POST(req: Request) {
    try {
        await connectDB();
        const { userEmail, content, platform, type, media } = await req.json();

        if (!userEmail || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const draft = await Draft.create({
            userEmail,
            content,
            platform,
            type,
            media
        });

        return NextResponse.json({ success: true, draft });
    } catch (error) {
        console.error("Draft save error:", error);
        return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        const drafts = await Draft.find({ userEmail: email }).sort({ savedAt: -1 });
        return NextResponse.json({ drafts });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
    }
}
