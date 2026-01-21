import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const pendingData = url.searchParams.get("data");

    const fbAuthUrl = new URL("https://www.facebook.com/v12.0/dialog/oauth");
    fbAuthUrl.searchParams.append("client_id", process.env.FACEBOOK_CLIENT_ID!);
    fbAuthUrl.searchParams.append("redirect_uri", process.env.FACEBOOK_REDIRECT_URI!);
    fbAuthUrl.searchParams.append("state", "state");
    fbAuthUrl.searchParams.append("scope", "email,pages_show_list,pages_read_engagement,pages_manage_posts");
    fbAuthUrl.searchParams.append("response_type", "code");

    const response = NextResponse.redirect(fbAuthUrl.toString());

    if (pendingData) {
        response.cookies.set("facebook_pending_account", pendingData, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 10,
        });
    }

    return response;
}
