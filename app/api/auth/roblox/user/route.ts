import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userCookie = request.cookies.get('roblox_user');

  if (!userCookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const user = JSON.parse(userCookie.value);
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

