import { NextRequest, NextResponse } from 'next/server';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'No authorization code provided' }, { status: 400 });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Token exchange failed: ${tokenResponse.status}` 
      }, { status: 400 });
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Profile fetch failed:', profileResponse.status, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Profile fetch failed: ${profileResponse.status}` 
      }, { status: 400 });
    }

    const profile: LinkedInProfile = await profileResponse.json();

    // Make a post to LinkedIn immediately after authentication
    const timestamp = new Date().toLocaleString();
    const randomEmoji = ['🚀', '✨', '🎉', '💫', '🌟', '⚡', '🔥'][Math.floor(Math.random() * 7)];
    
    const postContent = {
      author: `urn:li:person:${profile.sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${randomEmoji} Just successfully connected my LinkedIn account to my automation app at ${timestamp}! Excited to share more updates and insights. #LinkedInAPI #Development #Automation #TechInnovation`
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    let postSuccess = false;
    let postId = null;

    try {
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postContent)
      });

      if (postResponse.ok) {
        const postResult = await postResponse.json();
        postSuccess = true;
        postId = postResult.id;
        console.log('LinkedIn post created successfully:', postId);
      } else {
        const errorText = await postResponse.text();
        console.error('LinkedIn post failed:', postResponse.status, errorText);
      }
    } catch (postError) {
      console.error('Error making LinkedIn post:', postError);
    }

    // Return success with user data and post status
    return NextResponse.json({
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
      profile: profile,
      postSuccess: postSuccess,
      postId: postId,
      message: postSuccess ? 'Authentication successful and post created!' : 'Authentication successful, but post failed'
    });

  } catch (error) {
    console.error('LinkedIn token exchange error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}