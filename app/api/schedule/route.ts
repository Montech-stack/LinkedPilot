import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";

// Helper: notify Python backend to sync schedule data
async function triggerPythonSync() {
  const pythonUrl = process.env.PYTHON_BACKEND_URL;
  if (!pythonUrl) return; // Skip if not configured

  try {
    await fetch(`${pythonUrl}/sync-schedules`, {
      method: "POST",
      headers: {
        "x-cron-secret": process.env.VERCEL_CRON_SECRET || "",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.warn("Failed to sync with Python backend:", err);
    // Don't block the response — sync failure is non-critical
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    await connectToDatabase();

    let query = {};
    if (mode !== "all") {
      const showHistory = searchParams.get("history") === "true";
      query = { posted: showHistory };
    }

    const posts = await ScheduledPost.find(query).sort({
      scheduledAt: 1, // Sort ascending by date
    });

    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, media, mediaType, scheduledAt, linkedinId } = body;

    await connectToDatabase();

    const doc = await ScheduledPost.create({
      linkedinId,
      content,
      media: media || null,
      mediaType: mediaType || null,
      scheduledAt: new Date(scheduledAt),
      posted: false,
    });

    // Sync to Python backend for execution tracking
    triggerPythonSync();

    return NextResponse.json(doc);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed creating post" }, { status: 500 });
  }
}
