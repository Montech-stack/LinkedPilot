import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { planId } = await req.json();
        if (!planId) {
            return NextResponse.json({ error: "Missing planId" }, { status: 400 });
        }

        await connectToDatabase();

        // If Enterprise, set tokens to -1 (Unlimited flag)
        // Otherwise, likely set based on plan defaults, or just update plan name and let logic handle it.
        // For now, we update plan name. The Billing Store sync handles the -1 display.
        // But for token usage backend checks, we might want tokensRemaining to be meaningful or ignored.
        // We'll update tokensRemaining if it's enterprise.

        const updateData: any = { plan: planId };

        if (planId === 'enterprise') {
            updateData.tokensRemaining = -1;
        } else if (planId === 'free') {
            // Optional: Reset to free limits? 
            // Better safest to just update plan and let other logic handle resets/additions.
        }

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateData },
            { new: true }
        );

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Failed to update plan:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
