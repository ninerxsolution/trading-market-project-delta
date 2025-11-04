import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    // Create user in database
    const dbUser = await prisma.user.create({
      data: {
        username,
        email,
        password, // In production, hash with bcrypt
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        joinDate: new Date().toISOString().split('T')[0],
        bio: 'New trader!',
      },
    });

    // Create session directly
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 60 * 60 * 24 * 7); // 7 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: dbUser.id,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        avatar: dbUser.avatar,
        joinDate: dbUser.joinDate,
        bio: dbUser.bio,
        role: (dbUser as any).role,
        tradePosts: [],
      },
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

