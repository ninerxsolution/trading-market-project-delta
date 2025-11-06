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

// PATCH - Update report status (admin only)
export async function PATCH(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only SUPER_ADMIN can update reports
		if (user.role !== 'SUPER_ADMIN') {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { id } = await context.params;
		const body = await request.json();
		const { status, adminNotes } = body;

		if (!status) {
			return NextResponse.json({ error: 'status is required' }, { status: 400 });
		}

		const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
		}

		const report = await prisma.report.update({
			where: { id },
			data: {
				status,
				adminNotes: adminNotes !== undefined ? adminNotes.trim() : undefined,
			},
			include: {
				reporter: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
				reportedUser: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
			},
		});

		return NextResponse.json({ report });
	} catch (error: any) {
		if (error.code === 'P2025') {
			return NextResponse.json({ error: 'Report not found' }, { status: 404 });
		}
		console.error('PATCH /api/reports/[id] error:', error);
		return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
	}
}

