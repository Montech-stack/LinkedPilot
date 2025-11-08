import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LinkedInUser from "@/models/LinkedInUser";
import ScheduledPost from "@/models/ScheduledPost";

export async function POST(request: NextRequest) {
  try {
    const { content, media, mediaType, scheduledAt } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });
    }

    const memberId = request.cookies.get("linkedin_member_id")?.value;
    if (!memberId) {
      return NextResponse.json({ error: "Not connected to LinkedIn" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await LinkedInUser.findOne({ linkedinId: memberId });
    if (!user) {
      return NextResponse.json({ error: "LinkedIn account not found" }, { status: 404 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
    }

    const doc = await ScheduledPost.create({
      linkedinId: memberId,
      content,
      media: media || null,
      mediaType: mediaType || null,
      scheduledAt: scheduledDate,
      posted: false,
    });

    return NextResponse.json({ success: true, scheduledId: doc._id });
  } catch (err: any) {
    console.error("Schedule route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
