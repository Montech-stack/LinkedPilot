import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const pendingData = url.searchParams.get("data");

    const twitterAuthUrl = new URL("https://twitter.com/i/oauth2/authorize");
    twitterAuthUrl.searchParams.append("response_type", "code");
    twitterAuthUrl.searchParams.append("client_id", process.env.TWITTER_CLIENT_ID!);
    twitterAuthUrl.searchParams.append("redirect_uri", process.env.TWITTER_REDIRECT_URI!);
    twitterAuthUrl.searchParams.append("scope", "tweet.read tweet.write users.read offline.access");
    twitterAuthUrl.searchParams.append("state", "state"); // Should be random
    twitterAuthUrl.searchParams.append("code_challenge", "challenge"); // Should be PKCE
    twitterAuthUrl.searchParams.append("code_challenge_method", "plain");

    const response = NextResponse.redirect(twitterAuthUrl.toString());

    if (pendingData) {
        response.cookies.set("twitter_pending_account", pendingData, {
            path: "/",
            httpOnly: true,
            maxAge: 60 * 10,
        });
    }

    return response;
}
