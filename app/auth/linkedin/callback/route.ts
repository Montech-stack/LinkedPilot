import { NextRequest, NextResponse } from 'next/server';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
  scope: string;
}

interface LinkedInProfile {
  sub: string;
  name: string;
  picture: string;
  email: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${baseUrl}?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}?error=no_code`);
  }

  try {
    // 🔹 Exchange code for access token + refresh token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Token exchange failed: ${text}`);
    }

    const tokenData: LinkedInTokenResponse = await tokenRes.json();
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = tokenData;

    // 🔹 Fetch user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) throw new Error('Failed to fetch profile');
    const profile: LinkedInProfile = await profileRes.json();

    // ✅ Set cookies
    const response = new NextResponse(
      `<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'linkedin-auth-success' }, '*');
          window.close();
        } else {
          window.location = '${baseUrl}/dashboard?linkedin=connected';
        }
      </script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

    const commonOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('linkedin_access_token', access_token, {
      ...commonOptions,
      maxAge: expires_in,
    });

    response.cookies.set('linkedin_user_id', profile.sub, {
      ...commonOptions,
      maxAge: expires_in,
    });

    if (refresh_token) {
      response.cookies.set('linkedin_refresh_token', refresh_token, {
        ...commonOptions,
        maxAge: refresh_token_expires_in || 60 * 60 * 24 * 60, // 60 days fallback
      });
    }

    return response;
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    return NextResponse.redirect(`${baseUrl}?error=callback_failed`);
  }
}
