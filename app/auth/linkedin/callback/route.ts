import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

interface LinkedInPostResponse {
  id: string;
  lifecycleState: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Handle OAuth errors
  if (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}?error=${error}`);
  }

  // Handle missing authorization code
  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}?error=no_code`);
  }

  try {
    // Exchange authorization code for access token
    const tokenBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    });

    console.log('Token exchange request:', {
      url: 'https://www.linkedin.com/oauth/v2/accessToken',
      client_id: process.env.LINKEDIN_CLIENT_ID,
      redirect_uri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
      code: code?.substring(0, 10) + '...', // Only show first 10 chars for security
    });

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody,
    });

    const responseText = await tokenResponse.text();
    console.log('LinkedIn token response:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      body: responseText,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code for token`);
    }

    const tokenData: LinkedInTokenResponse = JSON.parse(responseText);
    const { access_token, expires_in } = tokenData;

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const profile: LinkedInProfile = await profileResponse.json();

    // Store access token and user info (using cookies for persistence)
    const cookieStore = cookies();
    cookieStore.set('linkedin_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in, // Token expiry
    });
    cookieStore.set('linkedin_user_id', profile.sub, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in,
    });

    // TODO: Also store in your database for longer persistence
    // await saveUserTokenToDatabase(profile.sub, access_token, expires_in);

    // Make a post to LinkedIn
    const postContent = {
      author: `urn:li:person:${profile.sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: '🚀 Just connected my app to LinkedIn! Excited to share more updates. #LinkedInAPI #Development'
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
      // Don't fail the whole flow if posting fails
    } else {
      const postResult: LinkedInPostResponse = await postResponse.json();
      console.log('LinkedIn post created:', postResult.id);
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?linkedin=connected&posted=true`);

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}?error=callback_failed`);
  }
}