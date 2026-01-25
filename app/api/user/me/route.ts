import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

// Helper to escape regex special characters
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: Request) {
    console.log("🚀 [API/user/me] Request received");
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            console.log("❌ [API/user/me] No session or email");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("👤 [API/user/me] Session Email:", session.user.email);

        try {
            await connectToDatabase();
            console.log("✅ [API/user/me] DB Connected");
        } catch (dbError) {
            console.error("❌ [API/user/me] DB Connection Failed:", dbError);
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Safe Regex
        const safeEmail = escapeRegExp(session.user.email);
        const emailRegex = new RegExp(`^${safeEmail}$`, "i");

        console.log("🔍 [API/user/me] Querying User with regex:", emailRegex);

        let user;
        try {
            user = await User.findOne({ email: { $regex: emailRegex } }).select("plan tokensRemaining email");
        } catch (queryError) {
            console.error("❌ [API/user/me] Query Failed:", queryError);
            return NextResponse.json({ error: "Database query failed" }, { status: 500 });
        }

        if (!user) {
            console.log("❌ [API/user/me] User not found in DB");
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        console.log("✅ [API/user/me] Success:", user.email, user.plan, user.tokensRemaining);

        return NextResponse.json({
            plan: user.plan || "free",
            tokens: user.tokensRemaining || 0
        });

    } catch (error: any) {
        console.error("❌ [API/user/me] FATAL ERROR:", error);
        return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
    }
}
