// app/api/social/post/route.ts
import { NextResponse } from "next/server";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { postToLinkedIn } from "@/lib/postToLinkedIn"; // Assuming you have this from previous

export async function POST(req: Request) {
  try {
    console.log("🔵 /api/social/post POST called");
    await connectToDatabase();
    console.log("🟢 Connected to MongoDB");

    // Check for cron secret first (bypass session if valid)
    const cronSecret = req.headers.get("x-cron-secret"); // Case-insensitive, but match your fetch (use lowercase for consistency)
    const isCron = cronSecret === process.env.VERCEL_CRON_SECRET;

    let userId;
    if (!isCron) {
      // Fallback to session check for non-cron calls
      const session = await getServerSession(authOptions);
      console.log("🟡 Session userId:", session?.user?.id);
      if (!session?.user?.id) {
        console.log("❌ No session");
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.user.id;
    } else {
      console.log("🟢 Cron secret validated - bypassing session check");
      // For cron, handle as system-level (no userId required, or pass it in body if needed)
      userId = null; // Adjust if you need to derive userId from body or elsewhere
    }

    const body = await req.json();
    console.log("📥 POST body:", body);
    const { platform, accountId, content, media, mediaType } = body;
    console.log("🔹 Parsed:", { platform, accountId, content: content?.length || 0, hasMedia: !!media });

    if (!platform || !accountId || !content?.trim()) {
      console.log("❌ Missing fields:", { platform, accountId, contentTrim: content?.trim() });
      return NextResponse.json({ error: "Missing required fields: platform, accountId, or content" }, { status: 400 });
    }

    // Relax userId check for cron calls
    const socialAccountQuery = userId ? { _id: accountId, userId } : { _id: accountId };
    const socialAccount = await SocialAccount.findOne(socialAccountQuery);
    console.log("🔹 SocialAccount found:", !!socialAccount, socialAccount?.connected, socialAccount?.linkedinId, socialAccount);

    if (!socialAccount || !socialAccount.connected) {
      return NextResponse.json({ error: "Account not found or not connected" }, { status: 404 });
    }

    let result;
    if (platform.toLowerCase() === "linkedin") {
      const memberId = socialAccount.linkedinId;
      if (!memberId) {
        console.log("❌ No linkedinId");
        return NextResponse.json({ error: "No LinkedIn ID associated" }, { status: 404 });
      }
      console.log("🔹 Posting to LinkedIn for memberId:", memberId);
      result = await postToLinkedIn({ memberId, content: content.trim(), media, mediaType });
      console.log("🟢 LinkedIn post result:", result);
    } else {
      console.log("❌ Unsupported platform:", platform);
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("🔴 Error posting to social:", error);
    return NextResponse.json({ error: "Failed to post", details: error.message }, { status: 500 });
  }
}