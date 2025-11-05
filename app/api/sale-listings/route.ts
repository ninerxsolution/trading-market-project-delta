import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/sale-listings - create a sale listing (item, price, description, stock)
export async function POST(request: NextRequest) {
	try {
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { itemId, price, description, image, stock } = await request.json();
		if (!itemId || typeof price !== 'number' || price <= 0 || !description) {
			return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
		}

		const item = await prisma.item.findUnique({ where: { id: itemId } });
		if (!item) {
			return NextResponse.json({ error: 'Item not found' }, { status: 400 });
		}

		const initialStock = typeof stock === 'number' && stock > 0 ? Math.floor(stock) : 1;
		const listing = await prisma.saleListing.create({
			data: {
				userId: sessionData.user.id,
				itemId,
				price,
				description,
				image: image || null,
				stock: initialStock,
				status: initialStock > 0 ? 'ACTIVE' : 'INACTIVE',
			},
		});

		// Optional: also record/refresh seller price point
		await prisma.itemPrice.create({ data: { itemId, sellerId: sessionData.user.id, price } }).catch(() => {});

		return NextResponse.json({ success: true, listing });
	} catch (error) {
		console.error('POST /api/sale-listings error:', error);
		return NextResponse.json({ error: 'Failed to create sale listing' }, { status: 500 });
	}
}


