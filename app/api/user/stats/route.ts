// api/user/stats/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User"; // Adjust path if needed

export async function GET(req: Request) {
  console.log("Stats API called at " + new Date().toISOString());
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email });
    return NextResponse.json({
      plan: user?.plan || "free",
      tokensRemaining: user?.tokensRemaining || 0
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
}