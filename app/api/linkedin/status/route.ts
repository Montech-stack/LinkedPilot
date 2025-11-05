import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('linkedin_access_token')?.value
  const userId = request.cookies.get('linkedin_user_id')?.value

  // Debug log to check if cookies exist
  console.log('linkedin_access_token:', accessToken)
  console.log('linkedin_user_id:', userId)

  if (!accessToken || !userId) {
    return NextResponse.json({ isAuthenticated: false })
  }

  return NextResponse.json({
    isAuthenticated: true,
    userId,
  })
}
