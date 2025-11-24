// ============================================
// FILE: /app/api/social/route.ts
// ============================================
import { NextResponse } from "next/server";
import SocialAccount from "@/models/SocialAccount";
import { connectToDatabase } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("🔵 /api/social GET called");

    await connectToDatabase();
    console.log("🟢 Connected to MongoDB");

    const session = await getServerSession(authOptions);
    console.log("🟡 Session:", session);

    if (!session?.user?.id) {
      console.log("❌ No session user found");
      return NextResponse.json([], { status: 200 });
    }

    const userId = session.user.id;

    console.log("🔹 Fetching accounts for user:", userId);

    const accounts = await SocialAccount.find({ userId }).sort({ createdAt: -1 });

    console.log("🟣 Accounts found:", accounts.length);

    return NextResponse.json(accounts);

  } catch (error) {
    console.error("🔴 Error fetching social accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}



export async function POST(req: Request) {
  try {
    console.log("🟦 /api/social POST called");

    await connectToDatabase();
    console.log("🟢 Connected to MongoDB");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("❌ No logged in user");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await req.json();

    console.log("📥 Payload received:", body);

    const { platform, name, email, connected, linkedinId } = body;

    if (!platform || !name || !email) {
      return NextResponse.json(
        { error: "Platform, Name, and Email are required." },
        { status: 400 }
      );
    }

    const record = await SocialAccount.create({
      platform,
      name,
      email,
      connected: connected ?? false,
      userId,
      linkedinId
    });

    console.log("🟢 Account created:", record);

    return NextResponse.json(record);

  } catch (error: any) {
    console.error("🔴 Error creating social account:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This account is already linked." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to link account." },
      { status: 500 }
    );
  }
}
