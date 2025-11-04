import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || '4315548699520888825';
  const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || 'http://localhost:3000/api/auth/roblox/callback';
  const expectedRedirectUri = 'https://2d7a810b4f87.ngrok-free.app/api/auth/roblox/callback';
  
  return NextResponse.json({
    clientId: ROBLOX_CLIENT_ID,
    redirectUri: ROBLOX_REDIRECT_URI,
    expectedRedirectUri: expectedRedirectUri,
    redirectUriMatches: ROBLOX_REDIRECT_URI === expectedRedirectUri,
    hasClientSecret: !!process.env.ROBLOX_CLIENT_SECRET,
    environment: process.env.NODE_ENV,
    baseUrl: request.nextUrl.origin,
    ngrokUrl: 'https://2d7a810b4f87.ngrok-free.app',
    message: 'OAuth configuration check',
    status: ROBLOX_REDIRECT_URI === expectedRedirectUri ? '✅ Configuration looks correct' : '⚠️ Redirect URI mismatch',
    instructions: {
      step1: 'Go to https://create.roblox.com/dashboard/credentials',
      step2: `Verify redirect URI in Roblox is exactly: ${expectedRedirectUri}`,
      step3: 'Make sure the redirect URI in Roblox matches exactly (no trailing slash, exact URL)',
      step4: 'If app is in review, you may need to wait or create a new app for testing',
      step5: 'Test the OAuth flow and check error messages',
    },
  });
}

