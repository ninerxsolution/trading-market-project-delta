import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/inbox - list conversation summaries for current user
export async function GET(request: NextRequest) {
	try {
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ conversations: [] }, { status: 401 });
		const userId: string = sessionData.user.id;

		const messages = await prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderId: userId },
					{ receiverId: userId },
				],
			},
			orderBy: { timestamp: 'desc' },
		});

		const map = new Map<string, { otherUserId: string; lastMessage: string; lastMessageTime: Date }>();
		for (const m of messages) {
			const other = m.senderId === userId ? m.receiverId : m.senderId;
			if (!map.has(other)) map.set(other, { otherUserId: other, lastMessage: m.message, lastMessageTime: m.timestamp });
		}

		const otherIds = Array.from(map.keys());
		const users = otherIds.length ? await prisma.user.findMany({ where: { id: { in: otherIds } } }) : [];
		const userMap = new Map(users.map(u => [u.id, u] as const));
		const conversations = Array.from(map.values()).map(c => ({
			otherUser: {
				id: c.otherUserId,
				username: userMap.get(c.otherUserId)?.username || 'Unknown',
				avatar: userMap.get(c.otherUserId)?.avatar || '',
				merchantName: userMap.get(c.otherUserId)?.merchantName || null,
			},
			lastMessage: c.lastMessage,
			lastMessageTime: c.lastMessageTime,
		}));

		return NextResponse.json({ conversations });
	} catch (e) {
		console.error('GET /api/inbox error:', e);
		return NextResponse.json({ conversations: [] }, { status: 500 });
	}
}


