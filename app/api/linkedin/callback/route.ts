// ============================================
// /app/api/linkedin/callback/route.ts (FIXED - Guaranteed linkedinId Save)
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
      console.error("❌ Missing authorization code")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=missing_code`)
    }

    console.log("🔵 [LINKEDIN CALLBACK] Starting OAuth flow...")

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: (process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/api/linkedin/callback").trim(),
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error("❌ Token exchange failed:", tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=token_failed`)
    }

    console.log("✅ [LINKEDIN CALLBACK] Access token received")

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

    console.log("✅ [LINKEDIN CALLBACK] LinkedIn user data:", {
      sub: userData.sub,
      name: userData.name,
      email: userData.email,
    })

    await connectToDatabase()

    // Get current user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.error("❌ No session found")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=no_session`)
    }

    const userId = session.user.id
    console.log("👤 [LINKEDIN CALLBACK] Current user ID:", userId)

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

    console.log("✅ [LINKEDIN CALLBACK] LinkedInUser saved:", linkedInUser._id)

    // 2. Get form data from cookie or use LinkedIn profile data
    let formData = {
      name: userData.name || "LinkedIn User",
      email: userData.email || "",
    }

    const pendingDataCookie = request.cookies.get("linkedin_pending_account")
    if (pendingDataCookie) {
      try {
        const pendingData = JSON.parse(pendingDataCookie.value)
        formData = {
          name: pendingData.name || formData.name,
          email: pendingData.email || formData.email,
        }
        console.log("📝 [LINKEDIN CALLBACK] Using pending form data:", formData)
      } catch (e) {
        console.warn("⚠️ [LINKEDIN CALLBACK] Failed to parse pending data, using LinkedIn profile")
      }
    } else {
      console.log("📝 [LINKEDIN CALLBACK] No pending data, using LinkedIn profile:", formData)
    }

    // 3. CRITICAL FIX: First check if account exists
    let socialAccount = await SocialAccount.findOne({
      platform: "LinkedIn",
      userId: userId,
      email: formData.email,
    })

    if (socialAccount) {
      // Account exists - UPDATE it
      console.log("🔄 [LINKEDIN CALLBACK] Updating existing account:", socialAccount._id)
      
      // Use direct update with save() to ensure it persists
      socialAccount.name = formData.name
      socialAccount.email = formData.email
      socialAccount.connected = true
      socialAccount.linkedinId = userData.sub // ← CRITICAL
      socialAccount.platform = "LinkedIn" // Ensure platform is set
      
      const savedAccount = await socialAccount.save()
      
      console.log("✅ [LINKEDIN CALLBACK] Account updated:", {
        id: savedAccount._id,
        linkedinId: savedAccount.linkedinId,
        connected: savedAccount.connected,
      })

      // Verify it was saved
      const verifyAccount = await SocialAccount.findById(savedAccount._id)
      console.log("🔍 [LINKEDIN CALLBACK] Verification:", {
        hasLinkedinId: !!verifyAccount?.linkedinId,
        linkedinId: verifyAccount?.linkedinId,
      })

      if (!verifyAccount?.linkedinId) {
        console.error("❌ [LINKEDIN CALLBACK] CRITICAL: linkedinId NOT SAVED!")
        // Try one more time with updateOne
        await SocialAccount.updateOne(
          { _id: savedAccount._id },
          { 
            $set: { 
              linkedinId: userData.sub,
              connected: true,
              name: formData.name,
              email: formData.email,
            } 
          }
        )
        console.log("🔄 [LINKEDIN CALLBACK] Attempted direct updateOne")
      }

    } else {
      // Account doesn't exist - CREATE it
      console.log("➕ [LINKEDIN CALLBACK] Creating new SocialAccount")
      
      socialAccount = await SocialAccount.create({
        platform: "LinkedIn",
        name: formData.name,
        email: formData.email,
        connected: true,
        userId: userId,
        linkedinId: userData.sub, // ← CRITICAL
      })
      
      console.log("✅ [LINKEDIN CALLBACK] New account created:", {
        id: socialAccount._id,
        linkedinId: socialAccount.linkedinId,
        connected: socialAccount.connected,
      })
    }

    // Final verification
    const finalCheck = await SocialAccount.findOne({
      platform: "LinkedIn",
      userId: userId,
      email: formData.email,
    })

    console.log("🏁 [LINKEDIN CALLBACK] Final state:", {
      found: !!finalCheck,
      id: finalCheck?._id,
      linkedinId: finalCheck?.linkedinId,
      hasLinkedinId: !!finalCheck?.linkedinId,
    })

    if (!finalCheck?.linkedinId) {
      console.error("❌ [LINKEDIN CALLBACK] CRITICAL ERROR: linkedinId still missing after save!")
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/links?error=linkedinid_save_failed`
      )
    }

    // 4. Success - redirect back
    const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?success=linkedin_connected`)
    
    // Clear pending data cookie
    res.cookies.delete("linkedin_pending_account")
    
    // Set LinkedIn member ID cookie
    res.cookies.set("linkedin_member_id", userData.sub, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    })

    console.log("✅ [LINKEDIN CALLBACK] OAuth flow complete!")
    return res

  } catch (error) {
    console.error("❌ [LINKEDIN CALLBACK] Error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/links?error=server_error`)
  }
}
