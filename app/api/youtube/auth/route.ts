import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const pendingData = url.searchParams.get("data");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID!);
    googleAuthUrl.searchParams.append("redirect_uri", process.env.GOOGLE_REDIRECT_URI!);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.email");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");

    const response = NextResponse.redirect(googleAuthUrl.toString());

    if (pendingData) {
        response.cookies.set("youtube_pending_account", pendingData, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 10,
        });
    }

    return response;
}
