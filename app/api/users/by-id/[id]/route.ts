import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) return NextResponse.json({ user: null }, { status: 404 });
		return NextResponse.json({
			user: {
				id: user.id,
				username: user.username,
				avatar: user.avatar,
				bio: user.bio,
			},
		});
	} catch (e) {
		return NextResponse.json({ user: null }, { status: 500 });
	}
}


