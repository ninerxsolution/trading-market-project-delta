import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/trade-posts - create a trade post; items must exist in DB
export async function POST(request: NextRequest) {
	try {
		const { itemHave, itemWant, description, image } = await request.json();

		if (!description || !itemHave || !itemWant) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Get user from session
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
			credentials: 'include',
			headers: { cookie: request.headers.get('cookie') || '' },
		});
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId: string = sessionData.user.id;

		// Validate items exist
		const [have, want] = await Promise.all([
			prisma.item.findUnique({ where: { id: itemHave } }),
			prisma.item.findUnique({ where: { id: itemWant } }),
		]);
		if (!have || !want) {
			return NextResponse.json({ error: 'Item not found' }, { status: 400 });
		}

		const post = await prisma.tradePost.create({
			data: {
				userId,
				itemHave,
				itemWant,
				description,
				image: image || null,
			},
		});

		return NextResponse.json({ success: true, post });
	} catch (error) {
		console.error('POST /api/trade-posts error:', error);
		return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
	}
}


