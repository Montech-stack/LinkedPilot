import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`
      )
    }

    // 🔹 Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log("🔹 LinkedIn token response:", tokenData)

    if (!tokenData.access_token) {
      throw new Error("Failed to obtain access token")
    }

    const accessToken = tokenData.access_token

    // 🔹 Step 2: Fetch LinkedIn user info using OpenID endpoint
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      throw new Error(`Failed to fetch LinkedIn profile: ${errorText}`)
    }

    const profileData = await profileResponse.json()
    console.log("✅ LinkedIn user info:", profileData)

    // 🔹 Step 3: Extract LinkedIn Member ID (from 'sub' or 'id' field)
    const memberId = profileData.sub || profileData.id
    if (!memberId) {
      throw new Error("Missing LinkedIn member ID in user info")
    }

    // 🔹 Step 4: Store both access token & member ID in cookies
    const cookieStore = await cookies()
    cookieStore.set("linkedin_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokenData.expires_in || 3600,
    })

    cookieStore.set("linkedin_member_id", memberId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokenData.expires_in || 3600,
    })

    // 🔹 Step 5: Redirect to dashboard after successful login
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?linked=success`
    )
  } catch (error: any) {
    console.error("🔥 LinkedIn callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=callback_failed`
    )
  }
}
