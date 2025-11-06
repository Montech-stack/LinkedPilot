import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies() // ✅ must await in Next.js 15+
  const accessToken = cookieStore.get("linkedin_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ isAuthenticated: false })
  }

  return NextResponse.json({ isAuthenticated: true })
}
