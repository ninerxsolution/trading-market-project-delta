import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
  const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI;
  const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET ? '***SET***' : 'NOT SET';
  
  // Check what redirect URI is registered in Roblox
  const expectedRedirectUri = 'https://2d7a810b4f87.ngrok-free.app/api/auth/roblox/callback';
  
  return NextResponse.json({
    status: 'OAuth Configuration Check',
    environment: {
      clientId: ROBLOX_CLIENT_ID,
      redirectUri: ROBLOX_REDIRECT_URI,
      clientSecret: ROBLOX_CLIENT_SECRET,
      expectedRedirectUri: expectedRedirectUri,
      match: ROBLOX_REDIRECT_URI === expectedRedirectUri,
    },
    checks: {
      hasClientId: !!ROBLOX_CLIENT_ID,
      hasRedirectUri: !!ROBLOX_REDIRECT_URI,
      hasClientSecret: !!process.env.ROBLOX_CLIENT_SECRET,
      redirectUriMatches: ROBLOX_REDIRECT_URI === expectedRedirectUri,
    },
    troubleshooting: {
      step1: 'ตรวจสอบว่า redirect URI ใน Roblox Dashboard ตรงกับ: ' + expectedRedirectUri,
      step2: 'ตรวจสอบว่า ngrok tunnel ยังรันอยู่',
      step3: 'ตรวจสอบว่า .env.local มี ROBLOX_REDIRECT_URI ถูกต้อง',
      step4: 'ถ้า app อยู่ใน review อาจจะต้องรอ หรือสร้าง app ใหม่',
    },
  });
}

