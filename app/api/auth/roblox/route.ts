import { NextRequest, NextResponse } from 'next/server';

const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || '4315548699520888825';
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || 'RBX-1XhhQWIm4EaUeiqdX5NVQvP5zBXJvNZ7MQSVitpHjAALuPkSzkWSQX5fKNndYpmU';
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'http://localhost:3000/api/auth/roblox/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'authorize') {
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build authorize URL
    const authorizeUrl = `https://authorize.roblox.com/v1/authorize?client_id=${ROBLOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(ROBLOX_REDIRECT_URI)}&response_type=Code&scope=openid+profile&state=${state}`;
    
    // Log for debugging
    console.log('Redirecting to Roblox authorize:', {
      clientId: ROBLOX_CLIENT_ID,
      redirectUri: ROBLOX_REDIRECT_URI,
      authorizeUrl,
    });
    
    // Store state in a cookie (you might want to use a session store in production)
    const response = NextResponse.redirect(authorizeUrl);
    
    // Check if using ngrok (HTTPS)
    const isNgrok = ROBLOX_REDIRECT_URI.includes('ngrok');
    
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: isNgrok || process.env.NODE_ENV === 'production', // true for HTTPS (ngrok)
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    return response;
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

