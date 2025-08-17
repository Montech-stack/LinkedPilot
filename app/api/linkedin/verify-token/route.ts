
// app/api/linkedin/verify-token/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Verify token by making a request to LinkedIn API
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const profile = await response.json()
      return NextResponse.json({ valid: true, profile })
    } else {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 })
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}