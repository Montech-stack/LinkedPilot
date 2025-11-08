import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";

export async function GET() {
  try {
    await connectToDatabase();

    const posts = await ScheduledPost.find({ posted: false }).sort({
      scheduledAt: 1,
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

    return NextResponse.json(doc);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "Failed creating post" }, { status: 500 });
  }
}
