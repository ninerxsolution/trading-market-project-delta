import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
	try {
		const { username } = await context.params;
		const user = await prisma.user.findUnique({ where: { username } });
		if (!user) return NextResponse.json({ listings: [], summary: { count: 0, total: 0 } }, { status: 404 });
    const listings = await prisma.saleListing.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' },
			include: { item: true },
		});
    let result = listings.map(l => ({
      id: l.id,
      price: l.price,
      description: l.description,
      image: l.image || l.item.image,
      createdAt: l.createdAt,
      item: { id: l.item.id, name: l.item.name, image: l.item.image, rarity: l.item.rarity },
    }));

    // Fallback: derive from ItemPrice if no explicit SaleListing found
    if (result.length === 0) {
      const prices = await prisma.itemPrice.findMany({
        where: { sellerId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      const latestByItem = new Map<string, number>();
      for (const p of prices) if (!latestByItem.has(p.itemId)) latestByItem.set(p.itemId, p.price);
      const itemIds = Array.from(latestByItem.keys());
      const items = itemIds.length ? await prisma.item.findMany({ where: { id: { in: itemIds } } }) : [];
      const itemMap = new Map(items.map(i => [i.id, i] as const));
      result = itemIds.map(id => ({
        id: `price-${id}`,
        price: latestByItem.get(id)!,
        description: '',
        image: itemMap.get(id)?.image || '',
        createdAt: new Date(),
        item: { id, name: itemMap.get(id)?.name || 'Item', image: itemMap.get(id)?.image || '', rarity: itemMap.get(id)?.rarity || '' },
      }));
    }

    const count = result.length;
    const total = result.reduce((s, l) => s + (l.price || 0), 0);
    return NextResponse.json({ listings: result, summary: { count, total } });
	} catch (e) {
		console.error('GET /api/users/[username]/listings error:', e);
		return NextResponse.json({ listings: [], summary: { count: 0, total: 0 } }, { status: 500 });
	}
}


