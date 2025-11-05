import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/inbox/by-order/[orderId] - messages linked to an order
export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    const cookie = request.headers.get('cookie') || '';
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
    const sessionData = await sessionRes.json();
    if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ messages: [] }, { status: 401 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ messages: [] }, { status: 404 });

    const requesterId: string = sessionData.user.id;
    const requesterRole: string | undefined = sessionData.user.role;
    const allowed = requesterRole === 'SUPER_ADMIN' || requesterId === order.sellerId || requesterId === order.buyerId;
    if (!allowed) return NextResponse.json({ messages: [] }, { status: 403 });

    const messages = await prisma.chatMessage.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (e) {
    console.error('GET /api/inbox/by-order/[orderId] error:', e);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}


