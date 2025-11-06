import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/inbox/[otherUserId] - fetch messages between current user and other user
// Query params: limit (default 10), offset (default 0)
// Returns messages ordered by timestamp asc (oldest to newest)
export async function GET(request: NextRequest, context: { params: Promise<{ otherUserId: string }> }) {
	try {
		const { otherUserId } = await context.params;
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user) return NextResponse.json({ messages: [] }, { status: 401 });
		const userId: string = sessionData.user.id;

		// Get pagination params
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get('limit') || '10', 10);
		const offset = parseInt(searchParams.get('offset') || '0', 10);

		// Get total count for pagination info
		const totalCount = await prisma.chatMessage.count({
			where: {
				OR: [
					{ senderId: userId, receiverId: otherUserId },
					{ senderId: otherUserId, receiverId: userId },
				],
			},
		});

		// Fetch messages: get latest messages first
		// offset = 0 means get the latest 10 messages
		// offset = 10 means get the next 10 older messages
		const allMessages = await prisma.chatMessage.findMany({
			where: {
				OR: [
					{ senderId: userId, receiverId: otherUserId },
					{ senderId: otherUserId, receiverId: userId },
				],
			},
			orderBy: { timestamp: 'desc' },
			skip: offset,
			take: limit,
		});

		// Reverse to get oldest to newest for display
		const messages = allMessages.reverse();

		// Sort by timestamp asc for display (should already be sorted after reverse)
		messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

		const hasMore = totalCount > offset + limit;

		return NextResponse.json({ messages, hasMore, totalCount });
	} catch (e) {
		console.error('GET /api/inbox/[otherUserId] error:', e);
		return NextResponse.json({ messages: [] }, { status: 500 });
	}
}


