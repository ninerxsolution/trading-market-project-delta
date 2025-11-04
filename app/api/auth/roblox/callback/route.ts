import { NextRequest, NextResponse } from 'next/server';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || '4315548699520888825';
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || 'RBX-1XhhQWIm4EaUeiqdX5NVQvP5zBXJvNZ7MQSVitpHjAALuPkSzkWSQX5fKNndYpmU';
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'http://localhost:3000/api/auth/roblox/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = request.nextUrl.origin;

  // Check for errors from Roblox
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  // Verify state - get from request cookies instead of using cookies() API
  const storedState = request.cookies.get('oauth_state')?.value;
  
  if (!state || state !== storedState) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', baseUrl)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: ROBLOX_CLIENT_ID,
        client_secret: ROBLOX_CLIENT_SECRET,
        redirect_uri: ROBLOX_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      console.error('Request details:', {
        grant_type: 'authorization_code',
        code: code,
        client_id: ROBLOX_CLIENT_ID,
        redirect_uri: ROBLOX_REDIRECT_URI,
      });
      return NextResponse.redirect(
        new URL(`/login?error=token_exchange_failed&details=${encodeURIComponent(errorData)}`, baseUrl)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, id_token } = tokenData;

    // Get user information using the access token
    const userResponse = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL('/login?error=userinfo_failed', baseUrl)
      );
    }

    const userInfo = await userResponse.json();

    // Decode ID token to get user ID (simplified - in production, verify JWT signature)
    let userId: string | null = null;
    if (id_token) {
      try {
        const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
        userId = payload.sub || payload.aud;
      } catch (e) {
        console.error('Error decoding ID token:', e);
      }
    }

    // Create user session (store in cookie or session storage)
    // Use ngrok URL from redirect URI if available
    let redirectUrl = baseUrl;
    if (ROBLOX_REDIRECT_URI.includes('ngrok')) {
      // Extract ngrok domain from redirect URI
      const urlMatch = ROBLOX_REDIRECT_URI.match(/https:\/\/([^/]+)/);
      if (urlMatch) {
        redirectUrl = `https://${urlMatch[1]}`;
      }
    }
    
    const response = NextResponse.redirect(new URL('/', redirectUrl));
    
    // Store user info in a secure cookie
    // For ngrok HTTPS, we need secure: true
    const isNgrok = baseUrl.includes('ngrok') || ROBLOX_REDIRECT_URI.includes('ngrok');
    
    response.cookies.set('roblox_user', JSON.stringify({
      id: userId || userInfo.sub,
      username: userInfo.preferred_username || userInfo.name,
      email: userInfo.email,
      avatar: userInfo.picture || `https://www.roblox.com/headshot-thumbnail/image?userId=${userId || userInfo.sub}&width=150&height=150&format=png`,
      access_token: access_token,
    }), {
      httpOnly: true,
      secure: isNgrok || process.env.NODE_ENV === 'production', // true for HTTPS (ngrok)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete('oauth_state');

    return response;
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    const baseUrl = request.nextUrl.origin;
    const errorMessage = error?.message || 'Unknown error';
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

