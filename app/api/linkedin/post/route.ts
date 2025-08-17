// app/api/linkedin/post/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, content, visibility = 'PUBLIC' } = body

    if (!accessToken || !content) {
      return NextResponse.json({ error: 'Access token and content are required' }, { status: 400 })
    }

    // First, get the user's profile ID
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 })
    }

    const profile = await profileResponse.json()

    // Create the post
    const postData = {
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility
      }
    }

    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    })

    if (postResponse.ok) {
      const result = await postResponse.json()
      return NextResponse.json({ success: true, postId: result.id })
    } else {
      const error = await postResponse.text()
      console.error('LinkedIn posting error:', error)
      return NextResponse.json({ 
        error: 'Failed to create post on LinkedIn' 
      }, { status: postResponse.status })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 })
  }
}
