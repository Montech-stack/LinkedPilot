import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = encodeURIComponent("http://localhost:3000/api/linkedin/callback");
  const scope = encodeURIComponent("openid profile email w_member_social");
  const state = Math.random().toString(36).substring(2);

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(authUrl);
}
