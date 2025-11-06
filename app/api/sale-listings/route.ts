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

		const { itemId, price, description, image, stock, tags } = await request.json();
		if (!itemId || typeof price !== 'number' || price <= 0) {
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
				description: description || '',
				image: image || null,
				stock: initialStock,
				status: initialStock > 0 ? 'ACTIVE' : 'INACTIVE',
			},
		});

		// Handle tags if provided
		if (Array.isArray(tags) && tags.length > 0) {
			for (const tagName of tags) {
				if (typeof tagName === 'string' && tagName.trim()) {
					// Find or create tag
					const tag = await prisma.tag.upsert({
						where: { name: tagName.trim() },
						update: {},
						create: { name: tagName.trim() },
					});

					// Create relation
					await prisma.saleListingTag.create({
						data: {
							listingId: listing.id,
							tagId: tag.id,
						},
					}).catch(() => {}); // Ignore if already exists
				}
			}
		}

		// Optional: also record/refresh seller price point
		await prisma.itemPrice.create({ data: { itemId, sellerId: sessionData.user.id, price } }).catch(() => {});

		return NextResponse.json({ success: true, listing });
	} catch (error) {
		console.error('POST /api/sale-listings error:', error);
		return NextResponse.json({ error: 'Failed to create sale listing' }, { status: 500 });
	}
}


