import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const pendingData = url.searchParams.get("data");

    // Instagram Graph API uses Facebook Login
    const instaAuthUrl = new URL("https://www.facebook.com/v12.0/dialog/oauth");
    instaAuthUrl.searchParams.append("client_id", process.env.INSTAGRAM_CLIENT_ID!); // Might be same as FB App ID
    instaAuthUrl.searchParams.append("redirect_uri", process.env.INSTAGRAM_REDIRECT_URI!);
    instaAuthUrl.searchParams.append("state", "state");
    instaAuthUrl.searchParams.append("scope", "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement");
    instaAuthUrl.searchParams.append("response_type", "code");

    const response = NextResponse.redirect(instaAuthUrl.toString());

    if (pendingData) {
        response.cookies.set("instagram_pending_account", pendingData, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 10,
        });
    }

    return response;
}
