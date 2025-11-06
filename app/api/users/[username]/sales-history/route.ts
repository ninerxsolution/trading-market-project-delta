import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
	try {
		const { username } = await context.params;
		const user = await prisma.user.findUnique({ where: { username } });
		if (!user) {
			return NextResponse.json({ sales: [], summary: { count: 0, total: 0 } }, { status: 404 });
		}

		// Get completed orders where user is the seller
		const completedOrders = await prisma.order.findMany({
			where: {
				sellerId: user.id,
				status: 'COMPLETED',
			},
			orderBy: {
				updatedAt: 'desc', // Use updatedAt for completion time
			},
		});

		// Get item details for each order
		const itemIds = [...new Set(completedOrders.map(o => o.itemId))];
		const items = itemIds.length > 0 
			? await prisma.item.findMany({ where: { id: { in: itemIds } } })
			: [];
		const itemMap = new Map(items.map(i => [i.id, i]));

		// Get buyer details for each order
		const buyerIds = [...new Set(completedOrders.map(o => o.buyerId))];
		const buyers = buyerIds.length > 0
			? await prisma.user.findMany({ where: { id: { in: buyerIds } } })
			: [];
		const buyerMap = new Map(buyers.map(u => [u.id, u]));

		// Format sales history
		const sales = completedOrders.map(order => {
			const item = itemMap.get(order.itemId);
			const buyer = buyerMap.get(order.buyerId);
			const quantity = order.quantity ?? 1;
			const totalPrice = order.price * quantity;

			return {
				id: order.id,
				item: item ? {
					id: item.id,
					name: item.name,
					image: item.image,
					rarity: item.rarity,
					type: (item as any).type || 'OTHER',
				} : null,
				buyer: buyer ? {
					id: buyer.id,
					username: buyer.username,
					avatar: buyer.avatar,
				} : null,
				price: order.price,
				quantity: quantity,
				totalPrice: totalPrice,
				completedAt: order.updatedAt, // Use updatedAt as completion time
				createdAt: order.createdAt,
			};
		});

		const count = sales.length;
		const total = sales.reduce((sum, s) => sum + s.totalPrice, 0);

		return NextResponse.json({
			sales,
			summary: { count, total },
		});
	} catch (e) {
		console.error('GET /api/users/[username]/sales-history error:', e);
		return NextResponse.json({ sales: [], summary: { count: 0, total: 0 } }, { status: 500 });
	}
}

