import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import SocialAccount from "@/models/SocialAccount";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Helper: notify Python backend to sync schedule data
async function triggerPythonSync() {
  const pythonUrl = process.env.PYTHON_BACKEND_URL;
  if (!pythonUrl) return;

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
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    await connectToDatabase();
    const session = await getServerSession(authOptions);

    let query: any = {};

    // Filter by current user
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    if (mode !== "all") {
      const showHistory = searchParams.get("history") === "true";
      query.posted = showHistory;
    }

    const posts = await ScheduledPost.find(query).sort({ scheduledAt: 1 });
    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch scheduled posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { content, media, mediaType, scheduledAt, linkedinId, platform, isDraft } = body;

    await connectToDatabase();

    // Resolve real linkedinId from SocialAccount if not provided directly
    let resolvedLinkedinId = linkedinId;
    if (!resolvedLinkedinId && session?.user?.id) {
      const account = await SocialAccount.findOne({
        userId: session.user.id,
        platform: { $regex: /linkedin/i },
        connected: true,
      });
      resolvedLinkedinId = account?.linkedinId || session.user.id;
    }

    const doc = await ScheduledPost.create({
      linkedinId: resolvedLinkedinId || "unknown",
      userId: session?.user?.id,
      content,
      media: media || null,
      mediaType: mediaType || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      isDraft: isDraft ?? !scheduledAt,
      platform: platform || "linkedin",
      posted: false,
    });

    triggerPythonSync();
    return NextResponse.json(doc);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed creating post" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, scheduledAt, isDraft, media, mediaType, platform } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await connectToDatabase();

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (isDraft !== undefined) updateData.isDraft = isDraft;
    if (media !== undefined) updateData.media = media;
    if (mediaType !== undefined) updateData.mediaType = mediaType;
    if (platform !== undefined) updateData.platform = platform;

    const doc = await ScheduledPost.findByIdAndUpdate(id, updateData, { new: true });

    if (!doc) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    triggerPythonSync();
    return NextResponse.json(doc);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed updating post" }, { status: 500 });
  }
}
