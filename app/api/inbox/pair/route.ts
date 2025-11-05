import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/inbox/pair?sellerId=...&buyerId=...
// Returns messages strictly between the two users. Requires requester to be SUPER_ADMIN or one of the two users.
export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ messages: [] }, { status: 401 });
    const requesterId: string = sessionData.user.id;
    const requesterRole: string | undefined = sessionData.user.role;

    const sellerId = request.nextUrl.searchParams.get('sellerId') || '';
    const buyerId = request.nextUrl.searchParams.get('buyerId') || '';
    if (!sellerId || !buyerId) return NextResponse.json({ messages: [] }, { status: 400 });

    const allowed = requesterRole === 'SUPER_ADMIN' || requesterId === sellerId || requesterId === buyerId;
    if (!allowed) return NextResponse.json({ messages: [] }, { status: 403 });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: sellerId, receiverId: buyerId },
          { senderId: buyerId, receiverId: sellerId },
        ],
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (e) {
    console.error('GET /api/inbox/pair error:', e);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}


