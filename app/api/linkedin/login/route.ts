// app/api/linkedin/login/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
    scope: "openid profile email w_member_social",
    state: "secure_random_state_" + Math.random().toString(36).substring(2, 15),
  })

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  )
}
