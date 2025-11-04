import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { broadcastTo } from '@/lib/realtime';

// POST /api/inbox/send - send message to another user
export async function POST(request: NextRequest) {
	try {
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const senderId: string = sessionData.user.id;

		const { toUserId, message } = await request.json();
		if (!toUserId || !message || !message.trim()) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const msg = await prisma.chatMessage.create({
			data: {
				senderId,
				receiverId: toUserId,
				message,
			},
		});

    // Broadcast to participants (sender + receiver)
    const payload = { type: 'message', message: msg };
    try { broadcastTo(toUserId, payload); } catch {}
    try { broadcastTo(senderId, payload); } catch {}

    return NextResponse.json({ success: true, message: msg });
	} catch (e) {
		console.error('POST /api/inbox/send error:', e);
		return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
	}
}


