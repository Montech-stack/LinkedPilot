import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import LinkedInUser from "@/models/LinkedInUser";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "http://localhost:3000/api/linkedin/callback",
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // sometimes optional
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Fetch LinkedIn profile via OpenID
    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();

    await connectToDatabase();

    await LinkedInUser.findOneAndUpdate(
      { linkedinId: userData.sub },
      {
        linkedinId: userData.sub,
        accessToken,
        refreshToken,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    const res = NextResponse.redirect("http://localhost:3000/dashboard");
    res.cookies.set("linkedin_member_id", userData.sub, { path: "/", httpOnly: true });
    return res;
  } catch (error) {
    console.error("LinkedIn Callback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
