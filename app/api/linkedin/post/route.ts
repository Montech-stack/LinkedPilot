import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies() // ✅ Await the cookies Promise
    const accessToken = cookieStore.get('linkedin_access_token')?.value
    const userId = cookieStore.get('linkedin_user_id')?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated with LinkedIn' }, { status: 401 })
    }

    const { content, media, mediaType } = await request.json()

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    // --- Continue with your post logic ---
    // Use accessToken instead of env var:
    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    })

    if (!postRes.ok) {
      const errorText = await postRes.text()
      console.error('LinkedIn post error:', errorText)
      return NextResponse.json({ success: false, error: 'Failed to create LinkedIn post' }, { status: 500 })
    }

    const data = await postRes.json()
    return NextResponse.json({ success: true, postId: data.id })
  } catch (error) {
    console.error('LinkedIn API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Unexpected error' }, { status: 500 })
  }
}
