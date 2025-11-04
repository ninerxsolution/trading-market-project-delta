import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		// Get last known price per seller for this item
		const prices = await prisma.itemPrice.findMany({
			where: { itemId: id },
			orderBy: { createdAt: 'desc' },
		});
		const latestBySeller = new Map<string, number>();
		for (const p of prices) {
			if (!latestBySeller.has(p.sellerId)) latestBySeller.set(p.sellerId, p.price);
		}
		const sellerIds = Array.from(latestBySeller.keys());
		if (sellerIds.length === 0) return NextResponse.json({ sellers: [] });
		const users = await prisma.user.findMany({ where: { id: { in: sellerIds } } });
		const sellers = users.map(u => ({
			id: u.id,
			username: u.username,
			avatar: u.avatar,
			bio: u.bio,
			price: latestBySeller.get(u.id)!,
		}));
		return NextResponse.json({ sellers });
	} catch (e) {
		console.error('GET /api/items/[id]/sellers error:', e);
		return NextResponse.json({ sellers: [] }, { status: 500 });
	}
}


