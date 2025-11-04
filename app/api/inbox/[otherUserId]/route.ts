import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/inbox/[otherUserId] - fetch messages between current user and other user
export async function GET(request: NextRequest, context: { params: Promise<{ otherUserId: string }> }) {
	try {
		const { otherUserId } = await context.params;
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ messages: [] }, { status: 401 });
		const userId: string = sessionData.user.id;

		const messages = await prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderId: userId, receiverId: otherUserId },
					{ senderId: otherUserId, receiverId: userId },
				],
			},
			orderBy: { timestamp: 'asc' },
		});

		return NextResponse.json({ messages });
	} catch (e) {
		console.error('GET /api/inbox/[otherUserId] error:', e);
		return NextResponse.json({ messages: [] }, { status: 500 });
	}
}


