import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const refreshToken = cookieStore.get("linkedin_refresh_token")?.value

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 })
  }

  try {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })

    const data = await res.json()
    console.log("🔄 Refresh token response:", data)

    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || "Token refresh failed")
    }

    // Update access token cookie
    cookieStore.set("linkedin_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.expires_in,
    })

    // Optionally refresh refresh_token too
    if (data.refresh_token) {
      cookieStore.set("linkedin_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("❌ Token refresh error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
