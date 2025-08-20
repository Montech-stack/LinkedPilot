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

    // TODO: Store in database for persistence
    // await saveUserToken(profile.sub, access_token, expires_in, profile);

    return NextResponse.json({
      success: true,
      accessToken: access_token,
      expiresIn: expires_in,
      profile: profile,
      message: 'LinkedIn connected successfully! You can now post from your dashboard.'
    });

  } catch (error) {
    console.error('LinkedIn token exchange error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}