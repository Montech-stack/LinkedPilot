
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SocialAccount from "@/models/SocialAccount";
import ScheduledPost from "@/models/ScheduledPost";
import { getServerSession } from "next-auth";

// Seeded random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        // Fetch connected accounts
        const accounts = await SocialAccount.find({ connected: true });

        // Generate Stats based on account ID (so they are persistent but fake)
        const analyticsData = accounts.map((acc: any) => {
            // Use part of ID as seed
            const seed = parseInt(acc._id.toString().substring(0, 8), 16);

            // Generate some realistic-looking numbers
            const followers = Math.floor(seededRandom(seed) * 50000) + 500;
            const views = Math.floor(followers * (0.05 + seededRandom(seed + 1) * 0.2));
            const engagement = Math.floor(views * 0.03);

            // Generate "Graph" data (last 7 days growth)
            const graphData = Array.from({ length: 7 }).map((_, i) => {
                const dailyViews = Math.floor(views / 30 * (0.8 + seededRandom(seed + i + 10) * 0.4));
                return {
                    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
                    views: dailyViews,
                    likes: Math.floor(dailyViews * 0.05)
                }
            });

            return {
                id: acc._id,
                platform: acc.platform,
                name: acc.name,
                stats: {
                    followers,
                    views,
                    engagement,
                    graphData
                }
            };
        });

        return NextResponse.json({
            success: true,
            analytics: analyticsData
        });

    } catch (error) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
