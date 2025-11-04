import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
	try {
		const { username } = await context.params;
		const decoded = decodeURIComponent(username);

		const user = await prisma.user.findUnique({
			where: { username: decoded },
		});

		if (!user) {
			return NextResponse.json({ user: null }, { status: 404 });
		}

		return NextResponse.json({
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				avatar: user.avatar,
				joinDate: user.joinDate,
				bio: user.bio,
				role: (user as any).role,
				tradePosts: [],
			},
		});
	} catch (error) {
		console.error('GET /api/users/[username] error:', error);
		return NextResponse.json({ user: null }, { status: 500 });
	}
}
