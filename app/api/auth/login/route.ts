import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mockUsers } from '@/lib/mock-data';

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Check in mock users first (for demo accounts)
    const mockUser = mockUsers.find(u => u.username === username);
    
    if (mockUser) {
      // For mock users, any password works
      // Check if user exists in database, if not create it
      let dbUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!dbUser) {
        // Create user in database from mock data
        dbUser = await prisma.user.create({
          data: {
            username: mockUser.username,
            email: mockUser.email,
            avatar: mockUser.avatar,
            joinDate: mockUser.joinDate,
            bio: mockUser.bio,
          },
        });
      }

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
    }

    // Check in database
    const dbUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // For database users, check password (in production, use bcrypt)
    // For now, accept any password for existing users
    if (dbUser.password && dbUser.password !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

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
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

