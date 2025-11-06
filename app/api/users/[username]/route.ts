import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session_token';

async function getCurrentUser() {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
		if (!sessionToken) return null;

		const session = await prisma.session.findUnique({
			where: { sessionToken },
			include: { user: true },
		});

		if (!session || session.expiresAt < new Date()) {
			return null;
		}

		return session.user;
	} catch {
		return null;
	}
}

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
				merchantName: user.merchantName,
				gameName: user.gameName,
				role: (user as any).role,
				tradePosts: [],
			},
		});
	} catch (error) {
		console.error('GET /api/users/[username] error:', error);
		return NextResponse.json({ user: null }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ username: string }> }) {
	try {
		const { username } = await context.params;
		const decoded = decodeURIComponent(username);

		// Check authentication
		const currentUser = await getCurrentUser();
		if (!currentUser) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is updating their own profile
		const targetUser = await prisma.user.findUnique({
			where: { username: decoded },
		});

		if (!targetUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		if (currentUser.id !== targetUser.id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get update data
		const body = await request.json();
		const { username: newUsername, email, avatar, bio, merchantName, gameName } = body;

		// Prepare update data
		const updateData: any = {};
		if (newUsername !== undefined && newUsername !== targetUser.username) {
			// Check if new username is already taken
			const existingUser = await prisma.user.findUnique({
				where: { username: newUsername },
			});
			if (existingUser) {
				return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
			}
			updateData.username = newUsername;
		}
		if (email !== undefined && email !== targetUser.email) {
			// Check if new email is already taken
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});
			if (existingUser) {
				return NextResponse.json({ error: 'Email already taken' }, { status: 400 });
			}
			updateData.email = email;
		}
		if (avatar !== undefined) updateData.avatar = avatar;
		if (bio !== undefined) updateData.bio = bio;
		if (merchantName !== undefined) updateData.merchantName = merchantName || null;
		if (gameName !== undefined) updateData.gameName = gameName || null;

		// Update user
		const updatedUser = await prisma.user.update({
			where: { id: targetUser.id },
			data: updateData,
		});

		return NextResponse.json({
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				email: updatedUser.email,
				avatar: updatedUser.avatar,
				joinDate: updatedUser.joinDate,
				bio: updatedUser.bio,
				merchantName: updatedUser.merchantName,
				gameName: updatedUser.gameName,
				role: (updatedUser as any).role,
			},
		});
	} catch (error) {
		console.error('PATCH /api/users/[username] error:', error);
		return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
	}
}
