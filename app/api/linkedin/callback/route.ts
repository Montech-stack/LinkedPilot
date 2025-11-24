
// ============================================
// FILE 2: /app/api/linkedin/callback/route.ts (UPDATED)
// ============================================
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import LinkedInUser from "@/models/LinkedInUser"
import SocialAccount from "@/models/SocialAccount"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/api/linkedin/callback",
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error("❌ Token exchange failed:", tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=token_failed`)
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    // Fetch LinkedIn profile
    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const userData = await userResponse.json()

    if (!userData.sub) {
      console.error("❌ Failed to fetch LinkedIn user data:", userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=user_fetch_failed`)
    }

    console.log("✅ LinkedIn user data:", userData)

    await connectToDatabase()

    // Get current user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || "guest"

    // 1. Save/Update LinkedInUser
    const linkedInUser = await LinkedInUser.findOneAndUpdate(
      { linkedinId: userData.sub },
      {
        linkedinId: userData.sub,
        accessToken,
        refreshToken,
        expiresAt,
      },
      { upsert: true, new: true }
    )

    console.log("✅ LinkedIn user saved:", linkedInUser._id)

    // 2. Get pending form data from cookie or default values
    let formData = {
      name: userData.name || "LinkedIn User",
      email: userData.email || "",
    }

    // Try to get form data from cookie (set by the links page)
    const pendingDataCookie = request.cookies.get("linkedin_pending_account")
    if (pendingDataCookie) {
      try {
        const pendingData = JSON.parse(pendingDataCookie.value)
        formData = {
          name: pendingData.name || formData.name,
          email: pendingData.email || formData.email,
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse pending account data:", e)
      }
    }

    console.log("📝 Using form data:", formData)

    // 3. Save to SocialAccount table
    const socialAccount = await SocialAccount.findOneAndUpdate(
      {
        platform: "LinkedIn",
        email: formData.email,
        userId: userId,
      },
      {
        platform: "LinkedIn",
        name: formData.name,
        email: formData.email,
        connected: true, // ← Automatically mark as connected
        userId: userId,
        linkedinId: userData.sub, // Link to LinkedInUser
      },
      { upsert: true, new: true }
    )

    console.log("✅ Social account saved:", socialAccount._id)

    // 4. Redirect back to links page with success
    const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?success=true`)
    
    // Clear the pending account cookie
    res.cookies.delete("linkedin_pending_account")
    
    // Set LinkedIn member ID for future reference
    res.cookies.set("linkedin_member_id", userData.sub, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return res
  } catch (error) {
    console.error("❌ LinkedIn Callback Error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=server_error`)
  }
}