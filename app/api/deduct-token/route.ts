// api/deduct-tokens/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User"; // Adjust path

export async function POST(req: Request) {
  const { usedTokens, email } = await req.json();

  if (!email || typeof usedTokens !== 'number') {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Check for enterprise/unlimited first
    const currentUser = await User.findOne({ email });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (currentUser.plan === 'enterprise' || currentUser.tokensRemaining === -1) {
      return NextResponse.json({ success: true, tokensRemaining: -1 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { tokensRemaining: -usedTokens } },
      { new: true }
    );

    return NextResponse.json({ success: true, tokensRemaining: user?.tokensRemaining });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to deduct tokens" }, { status: 500 });
  }
}