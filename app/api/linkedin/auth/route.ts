// ============================================
// FILE 3: /app/api/linkedin/auth/route.ts (NEW - Store Form Data)
// ============================================
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Get pending form data from sessionStorage (passed as query param)
  const url = new URL(request.url)
  const pendingData = url.searchParams.get("data")

  const linkedInAuthUrl = new URL("https://www.linkedin.com/oauth/v2/authorization")
  linkedInAuthUrl.searchParams.append("response_type", "code")
  linkedInAuthUrl.searchParams.append("client_id", process.env.LINKEDIN_CLIENT_ID!)
  linkedInAuthUrl.searchParams.append(
    "redirect_uri",
    process.env.LINKEDIN_REDIRECT_URI!.trim()
  )
  linkedInAuthUrl.searchParams.append("scope", "openid profile email w_member_social")

  const response = NextResponse.redirect(linkedInAuthUrl.toString())

  // Store pending account data in cookie
  if (pendingData) {
    response.cookies.set("linkedin_pending_account", pendingData, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
    })
  } 

  return response
}  