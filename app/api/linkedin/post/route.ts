import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { content, userId } = await request.json();

    if (!content) {
      return NextResponse.json({ 
        success: false, 
        error: 'No content provided' 
      }, { status: 400 });
    }

    // Get stored access token (from cookies or database)
    const cookieStore = cookies();
    const access_token = cookieStore.get('linkedin_access_token')?.value;
    const linkedin_user_id = cookieStore.get('linkedin_user_id')?.value;

    if (!access_token || !linkedin_user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'LinkedIn not connected. Please reconnect your account.' 
      }, { status: 401 });
    }

    // Create LinkedIn post with selected content
    const postContent = {
      author: `urn:li:person:${linkedin_user_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content // Use the selected content from dashboard
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postContent)
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('LinkedIn post failed:', postResponse.status, errorText);
      
      // Check if token expired
      if (postResponse.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'LinkedIn token expired. Please reconnect your account.' 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to post to LinkedIn' 
      }, { status: 400 });
    }

    const postResult = await postResponse.json();
    
    return NextResponse.json({
      success: true,
      postId: postResult.id,
      message: 'Successfully posted to LinkedIn!'
    });

  } catch (error) {
    console.error('LinkedIn post error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}