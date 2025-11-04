import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items - list items with aggregated average seller price
export async function GET(request: NextRequest) {
	try {
		const items = await prisma.item.findMany({
			include: {
				prices: {
					select: { price: true },
				},
			},
			orderBy: { name: 'asc' },
		});

		const result = items.map((it) => {
			const sellerPrices = it.prices.map((p) => p.price);
			const avgSellerPrice = sellerPrices.length
				? Math.round(sellerPrices.reduce((a, b) => a + b, 0) / sellerPrices.length)
				: null;
			return {
				id: it.id,
				name: it.name,
				image: it.image,
				description: it.description,
				rarity: it.rarity,
				averagePrice: it.averagePrice,
				avgSellerPrice,
				npcBuyPrice: (it as any).npcBuyPrice ?? null,
				npcSellPrice: (it as any).npcSellPrice ?? null,
				availability: (it as any).availability,
			};
		});

		return NextResponse.json({ items: result });
	} catch (error) {
		console.error('GET /api/items error:', error);
		return NextResponse.json({ items: [] }, { status: 500 });
	}
}

// POST /api/items - create item (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
	try {
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
			credentials: 'include',
			headers: { cookie },
		});
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user || sessionData.user.role !== 'SUPER_ADMIN') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { name, image, description, rarity, npcBuyPrice, npcSellPrice, availability } = await request.json();
		if (!name || !rarity) {
			return NextResponse.json({ error: 'name and rarity are required' }, { status: 400 });
		}

		const item = await prisma.item.create({
			data: {
				name,
				image: image || 'https://via.placeholder.com/200',
				description: description || '',
				rarity,
				averagePrice: 0,
				npcBuyPrice: npcBuyPrice ?? null,
				npcSellPrice: npcSellPrice ?? null,
				availability: availability || 'NOT_AVAILABLE',
			},
		});

		return NextResponse.json({ success: true, item });
	} catch (error) {
		console.error('POST /api/items error:', error);
		return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
	}
}


