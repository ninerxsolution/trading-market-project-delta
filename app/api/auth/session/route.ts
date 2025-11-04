import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

// GET - Get current session
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get session from database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Return user data
    const user = {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      avatar: session.user.avatar,
      joinDate: session.user.joinDate,
      bio: session.user.bio,
      role: (session.user as any).role,
      tradePosts: [],
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + SESSION_DURATION);

    // Create session in database
    const session = await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expiresAt,
      },
      include: { user: true },
    });

    // Set session cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        avatar: session.user.avatar,
        joinDate: session.user.joinDate,
        bio: session.user.bio,
        tradePosts: [],
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// DELETE - Delete session (logout)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return response;
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

