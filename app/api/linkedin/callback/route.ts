// app/api/linkedin/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing authorization code or state' }, { status: 400 })
  }

  try {
    const origin = request.headers.get('origin') || request.headers.get('host')
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${origin}/api/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Get user profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    const profileData = await profileResponse.json()

    // Return success page that closes popup and passes data to parent
    const html = `
      <html>
        <head>
          <title>LinkedIn Authentication</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
            <div style="color: #0077B5; font-size: 48px; margin-bottom: 20px;">✓</div>
            <h2 style="color: #333; margin-bottom: 10px;">Authentication Successful!</h2>
            <p style="color: #666; margin-bottom: 20px;">You can close this window.</p>
            <div style="background: #f0f8ff; padding: 10px; border-radius: 5px; font-size: 14px; color: #0077B5;">
              Connected as ${profileData.localizedFirstName} ${profileData.localizedLastName}
            </div>
          </div>
          <script>
            try {
              // Store auth data in localStorage
              localStorage.setItem('linkedin_access_token', '${tokenData.access_token}');
              localStorage.setItem('linkedin_profile', '${JSON.stringify(profileData)}');
              
              // Notify parent window
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'LINKEDIN_AUTH_SUCCESS', 
                  data: { 
                    accessToken: '${tokenData.access_token}',
                    profile: ${JSON.stringify(profileData)}
                  }
                }, '*');
              }
              
              // Close popup after a short delay
              setTimeout(() => {
                window.close();
              }, 2000);
            } catch (error) {
              console.error('Error in callback:', error);
              setTimeout(() => {
                window.close();
              }, 3000);
            }
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    
    const errorHtml = `
      <html>
        <head>
          <title>Authentication Error</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
            <div style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">✗</div>
            <h2 style="color: #333; margin-bottom: 10px;">Authentication Failed</h2>
            <p style="color: #666; margin-bottom: 20px;">Please try again.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}