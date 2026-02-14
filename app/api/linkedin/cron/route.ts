import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ScheduledPost from "@/models/ScheduledPost";
import { postToLinkedIn } from "@/lib/postToLinkedIn";

export async function GET() {
  try {
    await connectToDatabase();

    const due = await ScheduledPost.find({
      posted: false,
      scheduledAt: { $lte: new Date() },
    }).sort({ scheduledAt: 1 });

    let processed = 0;
    for (const p of due) {
      try {
        if (!p.linkedinId) {
          p.error = "No LinkedIn member ID on post";
          await p.save();
          continue;
        }

        await postToLinkedIn({
          memberId: p.linkedinId,
          content: p.content,
          media: p.media || undefined,
          mediaType: p.mediaType as "image" | "video" | undefined,
        });

        p.posted = true;
        p.error = null;
        await p.save();
        processed++;
      } catch (err: any) {
        console.error("Publish error for scheduled post", p._id, err);
        p.error = err?.message || String(err);
        await p.save();
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
