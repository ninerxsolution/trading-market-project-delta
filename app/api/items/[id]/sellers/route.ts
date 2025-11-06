import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        // Prefer real listings with stock
        const listings = await prisma.saleListing.findMany({
            where: { itemId: id, status: { in: ['ACTIVE', 'RESERVED'] }, stock: { gt: 0 } },
            orderBy: { updatedAt: 'desc' },
        });

        if (listings.length > 0) {
            const sellerIds = Array.from(new Set(listings.map(l => l.userId)));
            const users = await prisma.user.findMany({ where: { id: { in: sellerIds } } });
            const userMap = new Map(users.map(u => [u.id, u] as const));
            const sellers = listings.map(l => {
                const u = userMap.get(l.userId)!;
                return {
                    id: u.id,
                    username: u.username,
                    avatar: u.avatar,
                    bio: u.bio,
                    price: l.price,
                    stock: l.stock,
                    listingId: l.id,
                };
            });
            return NextResponse.json({ sellers });
        }

        // Fallback to last known price per seller if no listings
        const prices = await prisma.itemPrice.findMany({ where: { itemId: id }, orderBy: { createdAt: 'desc' } });
        const latestBySeller = new Map<string, number>();
        for (const p of prices) if (!latestBySeller.has(p.sellerId)) latestBySeller.set(p.sellerId, p.price);
        const sellerIds = Array.from(latestBySeller.keys());
        if (sellerIds.length === 0) return NextResponse.json({ sellers: [] });
        const users = await prisma.user.findMany({ where: { id: { in: sellerIds } } });
        const sellers = users.map(u => ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio, price: latestBySeller.get(u.id)! }));
        return NextResponse.json({ sellers });
    } catch (e) {
        console.error('GET /api/items/[id]/sellers error:', e);
        return NextResponse.json({ sellers: [] }, { status: 500 });
    }
}


