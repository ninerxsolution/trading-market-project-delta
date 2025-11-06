import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/items/[id] - update NPC fields (SUPER_ADMIN only; simple check relies on caller)
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user || sessionData.user.role !== 'SUPER_ADMIN') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}
		const body = await request.json();
		const { npcBuyPrice, npcSellPrice, availability, image, name, description, rarity, type } = body;

		const updateData: any = {};
		if (npcBuyPrice !== undefined) updateData.npcBuyPrice = npcBuyPrice;
		if (npcSellPrice !== undefined) updateData.npcSellPrice = npcSellPrice;
		if (availability !== undefined) updateData.availability = availability;
		if (image !== undefined) updateData.image = image;
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (rarity !== undefined) updateData.rarity = rarity;
		if (type !== undefined) updateData.type = type;

		const updated = await prisma.item.update({
			where: { id },
			data: updateData,
		});

		return NextResponse.json({ success: true, item: updated });
	} catch (error) {
		console.error('PATCH /api/items/[id] error:', error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

// DELETE /api/items/[id] - delete item (SUPER_ADMIN only)
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const cookie = request.headers.get('cookie') || '';
		const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/session`, { credentials: 'include', headers: { cookie } });
		const sessionData = await sessionRes.json();
		if (!sessionRes.ok || !sessionData?.user || sessionData.user.role !== 'SUPER_ADMIN') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		await prisma.item.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('DELETE /api/items/[id] error:', error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}


